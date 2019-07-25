<?php
$_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
if (empty($_POST['form_name'])) {
	echo '<p>No form_name supplied</p>';
	file_put_contents($module->getURL("log.txt"), "hi rochester");
} else {
	$html = $module->make_form_assoc_table($_POST['form_name']);
	echo $html;
}
?>