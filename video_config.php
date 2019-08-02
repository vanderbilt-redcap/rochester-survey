<?php
require_once str_replace("temp\\", "", APP_PATH_TEMP) . "redcap_connect.php";
require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
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
		<?php
			// if (count($project
		?>
	</div>
</div>
<?php

$rows = [];

// build rows array out so js can use it to fill html tbody
// each row will represent a question or answer
// foreach(

// echo "<pre>";
// print_r($project);
// echo "</pre>";


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

// testing
// echo "<pre>";
// $emLog = $module->framework->query("select * from redcap_external_modules_log_parameters WHERE name='field-value-associations' ORDER BY log_id DESC LIMIT 1");
// while ($row = db_fetch_assoc($emLog)) {
	// print_r($row);
// }
// echo "</pre>";

echo($injection_element);
?>