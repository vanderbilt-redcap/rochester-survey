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

if (empty($action) && isset($_GET['action'])) {
	$action = $_GET['action'];
}

if ($action !== 'save_changes') {
	$_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
}

if ($action == 'get_form_config') {
	$html = $module->make_field_val_association_page(htmlentities($_POST['form_name'], ENT_QUOTES));
	echo $html;
}

if (!empty($_FILES['image'])) {
	$uploaded_image = $_FILES['image'];
	$form_name = htmlentities($_POST['form_name'], ENT_QUOTES);
	
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
	$filename = $uploaded_image["name"];
	if (preg_match("/[^A-Za-z0-9. ()-]/", $filename)) {
		$errors[] = "File names can only contain alphabet, digit, period, space, hyphen, and parentheses characters.";
		$errors[] = "	Allowed characters: A-Z a-z 0-9 . ( ) -";
	}
	
	if (strlen($filename) > 127) {
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
		// save new image
		$new_edoc_id = $module->set_end_of_survey_image($form_name, $file['tmp_name']);
		
		// send back image
		$result = $module->query("SELECT * FROM redcap_edocs_metadata WHERE doc_id=?", [$new_edoc_id]);
		while ($row = $result->fetch_assoc()) {
			$uri = base64_encode(file_get_contents($module->framework->getSafePath($row["stored_name"], EDOC_PATH)));
			$mimeType = htmlspecialchars($row["mime_type"], ENT_QUOTES);
			$iconSrc = "data: $mimeType;base64,$uri";
			$imgElement = "<img src='$iconSrc' class='logo-image'>";
			$jsonArray = [
				"success" => true,
				"filename" => $filename,
				"html" => $imgElement
			];
		}
		
	}
	
	exit(json_encode($jsonArray));
}

if ($action == 'image_delete') {
	$end_of_survey = $_POST['end_of_survey'];
	$form_name = htmlentities($_POST['form_name'], ENT_QUOTES);
	
	// get settings or make new settings array
	$settings = $module->framework->getProjectSetting($form_name);
	if (empty($settings)) {
		return;
	} else {
		$settings = json_decode($settings, true);
	}
	
	// remove edoc from settings
	$old_edoc_id = $settings['endOfSurveyImage'];
	$settings['endOfSurveyImage'] = null;
	$module->setProjectSetting($form_name, json_encode($settings));
		
	// remove old edoc file
	$result = $module->query("SELECT * FROM redcap_edocs_metadata WHERE doc_id=?", [$old_edoc_id]);
	while ($row = $result->fetch_assoc()) {
		unlink($module->framework->getSafePath($row["stored_name"], EDOC_PATH));
	}
}

if ($action == 'export_settings') {
	// check for ZipArchive class
	if (!class_exists("ZipArchive")) {
		exit(json_encode(["error" => "The Rochester Accessibility Survey couldn't export video configuration settings because the ZipArchive class doesn't exist in this server environment."]));
	}
	
	$path = stream_get_meta_data(tmpfile())['uri'];
    $zip = new \ZipArchive;
    $zip->open($path, \ZipArchive::CREATE);
	
	// user clicked Export Settings on Video Configuration page
	$form_name = htmlentities($_GET['form_name'], ENT_QUOTES);
	$project = new \Project($module->framework->getProjectId());
	$form = &$project->forms[$form_name];
	if (empty($form)) {
		exit(json_encode(["error" => "Couldn't find field information for survey with form_name: $form_name"]));
	}
	if (empty($form["survey_id"])) {
		exit(json_encode(["error" => "This form is not a survey: $form_name"]));
	}
	
	$settings = $module->framework->getProjectSetting($form_name);
	
	if (empty($settings)) {
		exit(json_encode(["error" => "Couldn't find field information for survey with form_name: $form_name"]));
	} else {
		$settings_obj = json_decode($settings);
		if (empty($settings_obj)) {
			exit(json_encode(["error" => "No saved settings found for survey with form_name: $form_name"]));
		} else {
			$endOfSurveyImage = $settings_obj->endOfSurveyImage;
			if ($endOfSurveyImage == (int) $endOfSurveyImage and $endOfSurveyImage != 0) {
				// have a valid edoc_id, fetch image and save in zip archive
				$edocPath = \Files::copyEdocToTemp($endOfSurveyImage);
				if ($edocPath !== false) {
					if(!$zip->addFile($edocPath, "endOfSurveyImage.jpg")){
						throw new \Exception("Error adding edoc image to export zip");
					}
				}
				unset($settings_obj->endOfSurveyImage);
			}
			
			$zip->addFromString("video_configuration.json", json_encode($settings_obj));
			if(!$zip->close()){
				throw new \Exception('Error closing export zip');
			}
			
			$export_filename = "Survey Video Configuration.zip";
			header("Content-Type: application/zip");
			header("Content-Disposition: attachment; filename=$export_filename");
			header("Content-Length: " . filesize($path));

			readfile($path);
		}
	}
	
}

if ($action == 'import_settings') {
	// determine form_name and import_file_path
	$form_name = htmlentities($_POST['form_name'], ENT_QUOTES);
	
	$import_file_path = @$_FILES['import_file']['tmp_name'];
    if(empty($import_file_path)){
		$errormsg = "Video Configuration import failed for form '$form_name' -- couldn't determine import filepath.";
		\REDCap::logEvent("Rochester Survey Accessibility", $errormsg);
		header('Content-type: application/json');
		exit(json_encode(['error' => $errormsg]));
	}
	
	// read import file
	$import_file_contents = file_get_contents($import_file_path);
	
	// make ziparchive obj
	$zip = new \ZipArchive;
    $openResult = $zip->open($import_file_path);
	
    if($openResult !== true){
		$errormsg = "Video Configuration import failed for form '$form_name' -- the Rochester Survey Accessibility module couldn't open an empty ZipArchive object in this server environment.";
		\REDCap::logEvent("Rochester Survey Accessibility", $errormsg);
		header('Content-type: application/json');
		exit(json_encode(['error' => $errormsg]));
    }
	
	// count files in zip (should be 1 settings file and 0 or 1 image file)
	$file_count = $zip->count();
	if ($settings_json = $zip->getFromName("video_configuration.json")) {
		// check json encoding
		$settings_arr = json_decode($settings_json, true);
		if (empty($settings_arr)) {
			$errormsg = "Video Configuration import failed for form '$form_name' -- the Rochester Survey Accessibility couldn't decode the JSON string from 'video_configuration.json'.";
			\REDCap::logEvent("Rochester Survey Accessibility", $errormsg);
			header('Content-type: application/json');
			exit(json_encode(['error' => $errormsg]));
		}
		// remove endOfSurveyImage setting if set
		unset($filtered['endOfSurveyImage']);
		
		// sanitize
		$filtered = $module->sanitize_video_form_settings($settings_arr);
		$module->setProjectSetting($filtered['form_name'], json_encode($filtered));
	} else {
		$errormsg = "Video Configuration import failed for form '$form_name' -- the Rochester Survey Accessibility module couldn't find the expected 'video_configuration.json' in the uploaded zip file.";
		\REDCap::logEvent("Rochester Survey Accessibility", $errormsg);
		header('Content-type: application/json');
		exit(json_encode(['error' => $errormsg]));
	}
	
	if ($image_data = $zip->getFromName("endOfSurveyImage.jpg")) {
		$extractionPath = tempnam(sys_get_temp_dir(),'2h5');
		unlink($extractionPath);
		mkdir($extractionPath);
		
		// $zip->open();		// caused error in php 8.1
		$zip->extractTo($extractionPath, "endOfSurveyImage.jpg");
		$zip->close();
		
		$module->set_end_of_survey_image($form_name, "$extractionPath/endOfSurveyImage.jpg");
	} else {
		// erase endOfSurveyImage setting for this form
		$module->set_end_of_survey_image($form_name, null);
	}
	header('Content-type: application/json');
	exit(json_encode(["msg" => "Imported settings successfully."]));
}


?>