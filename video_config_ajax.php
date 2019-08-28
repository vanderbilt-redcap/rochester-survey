<?php

// file_put_contents("C:/vumc/log.txt", print_r($_POST

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

$_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
$action = $_POST['action'];
if ($action == 'get_form_config') {
	$html = $module->make_field_val_association_page($_POST['form_name']);
	echo $html;
} elseif ($action == 'save_changes') {
	// \REDCap::logEvent("Field Value Association Module", print_r($_POST, true), null, null, null, $_GET["pid"]);
	$data = json_decode($_POST['data'], true);
	$log_id = $module->framework->log("save_values", [
		"form-name" => $data["form_name"],
		"form-field-value-associations" => json_encode($data["form_data"])
	]);
	
	$module->framework->setProjectSetting("exitModalText", $data['exit_survey']['modalText']);
	$module->framework->setProjectSetting("exitModalVideo", $data['exit_survey']['modalVideo']);
	
	$data['log_id'] = $log_id;
	
	echo json_encode(json_encode($data));
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
	
	if ($action == 'portrait_upload') {
		$portraits = $module->framework->getProjectSetting("portraits");
		if (empty($portraits)) {
			$portraits = [];
		} else {
			$portraits = json_decode($portraits, true);
		}
		if (empty($portraits[$form_name])) {
			$portraits[$form_name] = [];
		}
		
		// determine which portrait index
		preg_match("/(\d+)/", $_POST['portrait_index'], $matches);
		$index = intval($matches[0]);
		
		// delete old edoc if edoc_id in storage
		if (!empty($portraits[$form_name][$index])) {
			$old_edoc_id = $portraits[$form_name][$index];
			$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$old_edoc_id";
			$result = db_query($sql);
			while ($row = db_fetch_assoc($result)) {
				unlink(EDOC_PATH . $row["stored_name"]);
			}
		}
		
		// save file
		$new_edoc_id = $module->framework->saveFile($file['tmp_name']);
		$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$new_edoc_id";
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$uri = base64_encode(file_get_contents(EDOC_PATH . $row["stored_name"]));
			$iconSrc = "data: {$row["mime_type"]};base64,$uri";
			$imgElement = "<img src='$iconSrc' class='portrait-image'>";
			$portraits[$form_name][$index] = $new_edoc_id;
			$module->framework->setProjectSetting("portraits", json_encode($portraits));
			$jsonArray = [
				"success" => true,
				"html" => $imgElement
			];
		}
	} elseif ($action == 'logo_upload') {
		$end_of_survey_images = $module->framework->getProjectSetting("end_of_survey_images");
		if (empty($end_of_survey_images)) {
			$end_of_survey_images = [];
		} else {
			$end_of_survey_images = json_decode($end_of_survey_images, true);
		}
		
		$old_edoc_id = $end_of_survey_images[$form_name];
		if (!empty($old_edoc_id)) {
			$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$old_edoc_id";
			$result = db_query($sql);
			while ($row = db_fetch_assoc($result)) {
				unlink(EDOC_PATH . $row["stored_name"]);
			}
		}
		
		// save file
		$new_edoc_id = $module->framework->saveFile($file['tmp_name']);
		$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$new_edoc_id";
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$uri = base64_encode(file_get_contents(EDOC_PATH . $row["stored_name"]));
			$iconSrc = "data: {$row["mime_type"]};base64,$uri";
			$imgElement = "<img src='$iconSrc' class='logo-image'>";
			$end_of_survey_images[$form_name] = $new_edoc_id;
			$module->framework->setProjectSetting("end_of_survey_images", json_encode($end_of_survey_images));
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