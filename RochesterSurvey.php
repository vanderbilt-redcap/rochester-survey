<?php
namespace Vanderbilt\RochesterSurvey;

class RochesterSurvey extends \ExternalModules\AbstractExternalModule {
	function redcap_survey_page($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $survey_hash, $response_id = NULL, $repeat_instance = 1) {
		file_put_contents("C:/vumc/log.txt", "hi\n");
		$html = <<<EOD
		<div id="rochester-module" class="container">
			<div id="survey-video" class="row">
				<iframe width="560" height="315" src="https://www.youtube.com/embed/ZEUeujtc4rY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
			</div>
			<button id="survey-options" class="btn btn-secondary">Survey Options<i class="fas fa-cog" style="margin-left: 8px"></i></button>
			<div id="survey-content" class="row">
				
			</div>
			<div id="survey-navigation" class="row">
				<button class="btn btn-primary">Back</button>
				<button class="btn btn-primary">Next</button>
			</div>
		</div>
EOD;
		// inject html, js, and css that overrides existing page container
		$pid = 43;
		$data_dictionary_json = json_encode(\Metadata::getDataDictionary("json", true, array(), array(), false, false, null, $pid));
		$data_dictionary_json = trim($data_dictionary_json, "\"");
		// $data_dictionary_json = str_replace(array("\\", "\\\\"), "", $data_dictionary_json);
		file_put_contents("C:/vumc/log.txt", $data_dictionary_json . "\n", FILE_APPEND);
		
		$survey_script = file_get_contents($this->getUrl("js/survey.js"));
		$survey_script = str_replace("CSS_URL", $this->getUrl("css/survey.css"), $survey_script);
		$survey_script = str_replace("BOOTSTRAP_URL", $this->getUrl("js/bootstrap.min.js"), $survey_script);
		$survey_script = str_replace("SURVEY_HTML", "`$html`", $survey_script);
		$injection_element = "
		<!-- Rochester survey interface module -->
		<script type=\"text/javascript\">
			$survey_script
			
			// Rochester.dataDictionary = `$data_dictionary_json`;
			// Rochester.dataDictionary = JSON.parse(Rochester.dataDictionary);
		</script>";
		
		echo($injection_element);
	}
}

// https://www.youtube.com/watch?v=ZEUeujtc4rY