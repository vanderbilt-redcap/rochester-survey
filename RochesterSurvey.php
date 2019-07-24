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
	
	function make_form_assoc_table($form_name) {
		$project = new \Project($module->framework->getProjectId());
		$form = $project->forms[$form_name];
		if (empty($form)) {
			return "<p>Couldn't find field information for survey with form_name: $form_name</p>";
		}
		if (empty($form["survey_id"])) {
			return "<p>This form is not a survey: $form_name</p>";
		}
		
		$html = '
		<p>You may associate a video URL with a given field or answer.</p>
		<table class="dataTable">
			<thead>
				<th>Type</th>
				<th>Label</th>
				<th>Value (1)</th>
			</thead>
			<tbody id="field_value_assoc">';
		
		// add form field/value rows
		foreach($form->fields as $field_name => $field) {
			if (!empty($field)) {
				$label = $project->metadata[$field_name]["element_label"];
				// $
				$options = [];
				
			}
		}
		
		$html .= '
			</tbody>
		</table>';
	}
}