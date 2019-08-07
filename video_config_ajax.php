<?php
// $_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
if (!empty($_POST['form_name'])) {
	$html = $module->make_field_val_association_page($_POST['form_name']);
	echo $html;
} elseif (!empty($_POST['action'])) {
	// \REDCap::logEvent("Field Value Association Module", print_r($_POST, true), null, null, null, $_GET["pid"]);
	$data = json_decode($_POST['data'], true);
	$log_id = $module->framework->log("save_values", [
		"form-name" => $data["form_name"],
		"form-field-value-associations" => json_encode($data["form_data"])
	]);
	$data['log_id'] = $log_id;
	
	echo json_encode(json_encode($data));
	// echo $_POST['data'];
	// echo "\"{}\"";
} else {
	echo '<p>No form_name or action POST parameter supplied.</p>';
	// \REDCap::logEvent("video_config_ajax called with no ", "msg", null, null, null, $_GET["pid"]);
}
?>