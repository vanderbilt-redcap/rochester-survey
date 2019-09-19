<?php
$_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
if (!empty($_POST['action'])) {
	// $module->framework->log("Rochester Survey module - " . $_POST['action'], $_POST['message'], null, null, null, $_GET["pid"]);
	\REDCap::logEvent("Rochester Survey module - " . $_POST['action'], $_POST['message'], null, null, null, $_GET["pid"]);
	return json_encode([
		'action' => $_POST['action'],
		'message' => $_POST['message']
	]);
}
?>