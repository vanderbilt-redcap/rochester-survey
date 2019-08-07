<?php
require_once str_replace("temp" . DIRECTORY_SEPARATOR, "", APP_PATH_TEMP) . "redcap_connect.php";
require_once APP_PATH_DOCROOT . 'ProjectGeneral' . DIRECTORY_SEPARATOR. 'header.php';
$project = new \Project($module->framework->getProjectId());
?>
<div>
	<h5>Survey Video Configuration</h5>
	<p>Select a survey form to associate values for:</p>
	<div class="dropdown">
		<button class="btn btn-outline-primary dropdown-toggle" type="button" id="form_picker" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
			Survey Forms
		</button>
		<div class="dropdown-menu form_picker_dd" aria-labelledby="form_picker">
			<?php
				foreach($project->forms as $form_name => $form) {
					if (!empty($form["survey_id"])) {
						echo '<a value="' . $form_name . '"class="dropdown-item" href="#">' . $form["menu"] . '</a>';
					}
				}
			?>
		</div>
	</div>
	<div id="form_assocs">
	</div>
</div>
<?php

require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

// add our video config js file
$survey_script = file_get_contents($module->getUrl("js/video_config.js"));
$survey_script = str_replace("CSS_URL", $module->getUrl("css/video_config.css"), $survey_script);
$survey_script = str_replace("video_config_ajax.php", $module->getUrl("video_config_ajax.php"), $survey_script);
$injection_element = "
<!-- video_config for rochester survey module -->
<script type=\"text/javascript\">
	$survey_script
</script>";

echo($injection_element);
?>