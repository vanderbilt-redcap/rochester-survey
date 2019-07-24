<?php
$_POST  = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
if (empty($_POST['form_name'])) {
	echo '{msg: "no form_name supplied"}';
} else {
	$html = $module->make_form_assoc_table($_POST['form_name']);
	echo($html);
}
?>