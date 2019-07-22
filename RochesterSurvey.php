<?php
namespace Vanderbilt\RochesterSurvey;

class RochesterSurvey extends \ExternalModules\AbstractExternalModule {
	function redcap_survey_page($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $survey_hash, $response_id = NULL, $repeat_instance = 1) {
		// inject html, js, and css that overrides existing page container
		// $pid = $project_id;
		// $data_dictionary_json = json_encode(\Metadata::getDataDictionary("json", true, array(), array(), false, false, null, $pid));
		// $data_dictionary_json = trim($data_dictionary_json, "\"");
		// $data_dictionary_json = str_replace(array("\\", "\\\\"), "", $data_dictionary_json);
		
		$survey_script = file_get_contents($this->getUrl("js/survey.js"));
		$survey_script = str_replace("CSS_URL", $this->getUrl("css/survey.css"), $survey_script);
		$injection_element = "
		<!-- Rochester survey interface module -->
		<script type=\"text/javascript\">
			$survey_script
		</script>";
		
		echo($injection_element);
	}
}