<?php

require_once str_replace("temp" . DIRECTORY_SEPARATOR, "", APP_PATH_TEMP) . "redcap_connect.php";

/////////////
// from: https://stackoverflow.com/questions/15188033/human-readable-file-size
function humanFileSize($size,$unit="") {
  if( (!$unit && $size >= 1<<30) || $unit == "GB")
    return number_format($size/(1<<30),2)."GB";
  if( (!$unit && $size >= 1<<20) || $unit == "MB")
    return number_format($size/(1<<20),2)."MB";
  if( (!$unit && $size >= 1<<10) || $unit == "KB")
    return number_format($size/(1<<10),2)."KB";
  return number_format($size)." bytes";
}

function parse_size($size) {
  $unit = preg_replace('/[^bkmgtpezy]/i', '', $size); // Remove the non-unit characters from the size.
  $size = preg_replace('/[^0-9\.]/', '', $size); // Remove the non-numeric characters from the size.
  if ($unit) {
    // Find the position of the unit in the ordered string which is the power of magnitude to multiply a kilobyte by.
    return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
  }
  else {
    return round($size);
  }
}

// from: https://stackoverflow.com/questions/13076480/php-get-actual-maximum-upload-size
function file_upload_max_size() {
  static $max_size = -1;

  if ($max_size < 0) {
    // Start with post_max_size.
    $post_max_size = parse_size(ini_get('post_max_size'));
    if ($post_max_size > 0) {
      $max_size = $post_max_size;
    }

    // If upload_max_size is less, then reduce. Except if upload_max_size is
    // zero, which indicates no limit.
    $upload_max = parse_size(ini_get('upload_max_filesize'));
    if ($upload_max > 0 && $upload_max < $max_size) {
      $max_size = $upload_max;
    }
  }
  return $max_size;
}
/////////////

$action = $_POST['action'];
if ($action !== 'save_changes') {
	$_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
}

if ($action == 'get_form_config') {
	$html = $module->make_field_val_association_page($_POST['form_name']);
	echo $html;
} elseif ($action == 'save_changes') {
	$project = new \Project($module->framework->getProjectId());
	$data = json_decode($_POST['data'], true);
	$filtered = [
		"signer_urls" => [],
		"instructions_urls" => [],
		"fields" => []
	];
	$filtered['form_name'] = filter_var($data['form_name'], FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
	$survey_display_name = $project->forms[$filtered["form_name"]]["menu"];
	
	// if user cleared all values from survey config, delete settings in module
	if (empty($data['instructions_urls']) and
		empty($data['signer_urls']) and
		empty($data['fields']) and
		empty($data['exitModalText']) and
		empty($data['exitModalVideo'])) {
			$module->framework->removeProjectSetting($data['form_name']);
			exit('{
				"msg": "Removed all survey settings for ' . print_r($survey_display_name, true) . '"
			}');
	}
	
	// sanitize JSON -- starting with non-url fields
	$filtered['exitModalText'] = filter_var($data['exitModalText'], FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
	$filtered['exitModalVideo'] = filter_var($data['exitModalVideo'], FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
	
	// sanitize instructions urls
	foreach($data['instructions_urls'] as $i => $url) {
		$filtered['instructions_urls'][$i] = filter_var($url, FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
	}
	// sanitize signer urls
	foreach($data['signer_urls'] as $i => $url) {
		$filtered['signer_urls'][$i] = filter_var($url, FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
	}
	
	// sanitize field/choice URLs
	foreach ($data['fields'] as $field_name => $field_arr) {
		$filtered['fields'][$field_name] = [];
		if (isset($field_arr['field'])) {
			$filtered['fields'][$field_name]['field'] = [];
			foreach ($field_arr['field'] as $i => $url) {
				$filtered['fields'][$field_name]['field'][$i] = filter_var($url, FILTER_VALIDATE_URL, FILTER_NULL_ON_FAILURE);
			}
		}
		if (isset($field_arr['choices'])) {
			$filtered['fields'][$field_name]['choices'] = [];
			foreach ($field_arr['choices'] as $raw_value => $choice_arr) {
				$filtered['fields'][$field_name]['choices'][$raw_value] = [];
				foreach ($choice_arr as $i => $url) {
					$filtered['fields'][$field_name]['choices'][$raw_value][$i] = filter_var($url, FILTER_VALIDATE_URL, FILTER_NULL_ON_FAILURE);
				}
			}
		}
	}
	
	$module->framework->setProjectSetting($filtered["form_name"], json_encode($filtered));
	$settings = $module->framework->getProjectSetting($filtered["form_name"]);
	
	exit('{
		"msg": "Saved settings for ' . print_r($survey_display_name, true) . '"
	}');
} elseif (!empty($_FILES['image'])) {
	$uploaded_image = $_FILES['image'];
	$form_name = $_POST['form_name'];
	
	// check for transfer errors
	if ($uploaded_image["error"] !== 0) {
		exit(json_encode([
			"error" => true,
			"notes" => [
				"An error occured while uploading your image. Please try again."
			]
		]));
	}
	
	// have file, so check name, size
	$errors = [];
	if (preg_match("/[^A-Za-z0-9. ()-]/", $uploaded_image["name"])) {
		$errors[] = "File names can only contain alphabet, digit, period, space, hyphen, and parentheses characters.";
		$errors[] = "	Allowed characters: A-Z a-z 0-9 . ( ) -";
	}
	
	if (strlen($uploaded_image["name"]) > 127) {
		$errors[] = "Uploaded file has a name that exceeds the limit of 127 characters.";
	}
	
	$maxsize = file_upload_max_size();
	if ($maxsize !== -1) {
		if ($uploaded_image["size"] > $maxsize) {
			$fileReadable = humanFileSize($uploaded_image["size"], "MB");
			$serverReadable = humanFileSize($maxsize, "MB");
			$errors[] = "Uploaded file size ($fileReadable) exceeds server maximum upload size of $serverReadable.";
		}
	}
	
	$file = $uploaded_image;
	if(!exif_imagetype($file['tmp_name'])) {
		$errors[] = "Uploaded file does not appear to be an image (.jpg, .jpeg, .png, or .gif).";
	}
	
	if (!empty($errors)) {
		exit(json_encode([
			"error" => true,
			"notes" => $errors
		]));
	}
	
	$jsonArray = [
		"error" => true,
		"notes" => "REDCap wasn't able to retrieve the image from the database."
	];
	
	if ($action == 'logo_upload') {
		// get settings or make new settings array
		$settings = $module->framework->getProjectSetting($form_name);
		if (empty($settings)) {
			$settings = [];
		} else {
			$settings = json_decode($settings, true);
			
			// delete old image
			$old_edoc_id = $settings['endOfSurveyImage'];
			if (!empty($old_edoc_id)) {
				$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$old_edoc_id";
				$result = db_query($sql);
				while ($row = db_fetch_assoc($result)) {
					unlink(EDOC_PATH . $row["stored_name"]);
				}
			}
		}
		
		// save file
		$new_edoc_id = $module->framework->saveFile($file['tmp_name']);
		$settings['endOfSurveyImage'] = $new_edoc_id;
		$module->framework->setProjectSetting($form_name, json_encode($settings));
		
		// send back image
		$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$new_edoc_id";
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$uri = base64_encode(file_get_contents(EDOC_PATH . $row["stored_name"]));
			$iconSrc = "data: {$row["mime_type"]};base64,$uri";
			$imgElement = "<img src='$iconSrc' class='logo-image'>";
			$end_of_survey_images[$form_name] = $new_edoc_id;
			$jsonArray = [
				"success" => true,
				"html" => $imgElement
			];
		}
	}
	
	exit(json_encode($jsonArray));
} elseif ($action == 'image_delete') {
	$portrait = $_POST['portrait'];
	$end_of_survey = $_POST['end_of_survey'];
	$form_name = $_POST['form_name'];
	
	if ($portrait) {
		// change module setting 'portraits' json
		$portraits = json_decode($module->framework->getProjectSetting("portraits"), true);
		$old_edoc_id = $portraits[$form_name][$_POST['index']];
		$portraits[$form_name][$_POST['index']] = null;
		$module->framework->setProjectSetting("portraits", json_encode($portraits));
	} elseif ($end_of_survey) {
		// change module setting 'end_of_survey_images' json
		$end_of_survey_images = json_decode($module->framework->getProjectSetting("end_of_survey_images"), true);
		$old_edoc_id = $end_of_survey_images[$form_name];
		$end_of_survey_images[$form_name] = null;
		$module->framework->setProjectSetting("end_of_survey_images", json_encode($end_of_survey_images));
	}
		
	// remove old edoc
	$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$old_edoc_id";
	$result = db_query($sql);
	while ($row = db_fetch_assoc($result)) {
		unlink(EDOC_PATH . $row["stored_name"]);
	}
} else {
	echo '<p>No form_name or action POST parameter supplied.</p>';
	// \REDCap::logEvent("video_config_ajax called with no ", "msg", null, null, null, $_GET["pid"]);
}


?>