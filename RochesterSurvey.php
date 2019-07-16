<?php
namespace Vanderbilt\RochesterSurvey;

class RochesterSurvey extends \ExternalModules\AbstractExternalModule {
	function redcap_survey_page($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $survey_hash, $response_id = NULL, $repeat_instance = 1) {
		file_put_contents("C:/vumc/log.txt", "hi");
		$html = <<<EOD
		<div id="newcontainer">
			<span>hi</span>
		</div>
EOD;
		// inject html, js, and css that overrides existing page container
		$survey_script = file_get_contents($this->getUrl("js/survey.js"));
		$survey_script = str_replace("CSS_URL", $this->getUrl("css/survey.css"), $survey_script);
		$survey_script = str_replace("BOOTSTRAP_URL", $this->getUrl("js/bootstrap.min.js"), $survey_script);
		$survey_script = str_replace("SURVEY_HTML", "`$html`", $survey_script);
		$injection_element = "
		<script type=\"text/javascript\">
			$survey_script
		</script>";
		
		echo($injection_element);
	}
}