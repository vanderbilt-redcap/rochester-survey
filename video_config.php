<?php
require_once str_replace("temp" . DIRECTORY_SEPARATOR, "", APP_PATH_TEMP) . "redcap_connect.php";
require_once APP_PATH_DOCROOT . 'ProjectGeneral' . DIRECTORY_SEPARATOR. 'header.php';
$project = new \Project($module->framework->getProjectId());

$surveys = [];
foreach($project->forms as $form_name => $form) {
	if (!empty($form["survey_id"])) {
		$surveys[] = [
			"form_name" => htmlspecialchars($form_name, ENT_QUOTES),
			"form_menu" => htmlspecialchars($form["menu"], ENT_QUOTES)
		];
	}
}

if (count($surveys) == 0) {
	echo "<p>The Rochester Survey module found 0 survey instruments for this REDCap project. Please enable surveys and add a survey instrument.</p>";
} elseif (count($surveys) == 1) {
	echo "<p>". $module->framework->escape($module->make_field_val_association_page($surveys[0]["form_name"])) . "</p>";
} else {
	$html = "
	<div>
		<h5>Survey Video Configuration</h5>
		<p>Select a survey form to associate values for:</p>
		<div class='dropdown'>
			<button class='btn btn-outline-primary dropdown-toggle' type='button' id='form_picker' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
				Survey Forms
			</button>
			<div class='dropdown-menu form_picker_dd' aria-labelledby='form_picker'>";
	foreach($surveys as $survey) {
		$html .= '<a value="' . $module->framework->escape($survey["form_name"]) . '"class="dropdown-item" href="#">' . $module->framework->escape($survey["form_menu"]) . '</a>';
	}
	$html .= "
			</div>
		</div>
		<div id='form_assocs'>
		</div>
	</div>";
	echo $html;
}

?>
<script>
	var Rochester = {
		configAjaxUrl: <?=json_encode($module->getUrl("video_config_ajax.php"))?>,
		saveConfigUrl: <?=json_encode($module->getUrl("save_config.php"))?>
	}
</script>

<link rel="stylesheet" type="text/css" href="<?=$module->getUrl("css/video_config.css")?>">
<script src="<?=$module->getUrl("js/video_config.js")?>"></script>
<?php

require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';