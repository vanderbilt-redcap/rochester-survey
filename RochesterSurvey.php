<?php
namespace Vanderbilt\RochesterSurvey;

class RochesterSurvey extends \ExternalModules\AbstractExternalModule {
	function redcap_survey_page($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $survey_hash, $response_id = NULL, $repeat_instance = 1) {
		$fbf_surveys = $this->framework->getProjectSetting("survey_name");
		$found_this_form = false;
		foreach($fbf_surveys as $name) {
			if ($instrument === $name) {
				$found_this_form = true;
				break;
			}
		}
		if (!$found_this_form)
			return false;
		
		// inject html, js, and css that overrides existing page container
		// $pid = $project_id;
		// $data_dictionary_json = json_encode(\Metadata::getDataDictionary("json", true, array(), array(), false, false, null, $pid));
		// $data_dictionary_json = trim($data_dictionary_json, "\"");
		// $data_dictionary_json = str_replace(array("\\", "\\\\"), "", $data_dictionary_json);
		
		
		$emLog = $this->framework->query("select * from redcap_external_modules_log_parameters WHERE name='field-value-associations' ORDER BY log_id DESC LIMIT 1");
		$record = db_fetch_assoc($emLog);
		$prevSettings = "";
		if (!empty($record["value"])) {
		// // } else {
			// echo "<pre>";
			$prevSettings = "associatedValues = JSON.parse(`{$record["value"]}`);";
			// echo $prevSettings;
			// echo "</pre>";
			
		}
		
		$survey_script = file_get_contents($this->getUrl("js/survey.js"));
		$survey_script = str_replace("CSS_URL", $this->getUrl("css/survey.css"), $survey_script);
		$injection_element = "
		<!-- Rochester survey interface module -->
		<script type=\"text/javascript\">
			$prevSettings
			$survey_script
		</script>";
		
		echo($injection_element);
	}
	
	function make_field_val_association_page($form_name) {
		$project = new \Project($this->framework->getProjectId());
		$form = &$project->forms[$form_name];
		if (empty($form)) {
			return "<p>Couldn't find field information for survey with form_name: $form_name</p>";
		}
		if (empty($form["survey_id"])) {
			return "<p>This form is not a survey: $form_name</p>";
		}
		
		$html = '
		<p>You may associate a video URL with a given field or answer.</p>
		<div id="table-controls">
			<div class="custom-control custom-switch">
			  <input type="checkbox" class="custom-control-input" checked="true" id="applyToDuplicates">
			  <label class="custom-control-label" for="applyToDuplicates">Duplicate values for fields and answers with identical labels (per column)</label>
			</div>
			<br>
			<button class="btn btn-outline-primary" type="button" id="add_value_col">
				Add Value Column
			</button>
		</div>
		<table id="assoc_table" class="field_value">
			<thead>
				<th class="type_column">Type</th>
				<th class="label_column">Label</th>
				<th class="value_column">
					<div>
						<span>Value (1)</span>
					</div>
				</th>
			</thead>
			<tbody id="field_value_assoc">';
		
		// $html .= "<tr><td>" . print_r($form, true) . "</td></tr>";
		
		foreach($form["fields"] as $field_name => $field) {
			if (!empty($field)) {
				$value_col = "<input type=\"text\" class=\"form-control\" placeholder=\"Value\" aria-label=\"Associated value\" aria-describedby=\"basic-addon1\">";
				$label_col = nl2br($project->metadata[$field_name]["element_label"]);
				$type_col = "Descriptive";
				if ($project->metadata[$field_name]["element_preceding_header"] == "Form Status") {
					continue;
				} else {
					$type_col = "Question (" . $project->metadata[$field_name]["element_type"] . ")";
				}
				$html .= <<< EOF
				<tr class="value-row" data-field-name="$field_name">
					<td class="type_column">$type_col</td>
					<td class="label_column">$label_col</td>
					<td class="value_column">$value_col</td>
				</tr>
EOF;
				$type_col = "Answer";
				// preg_match_all("/\,\s*?(.+)\s*?(?:\\n|$)/mgU", $project->metadata[$field_name]["element_enum"], $matches);
				if (!empty($project->metadata[$field_name]["element_enum"])) {
					$labels = explode("\\n", $project->metadata[$field_name]["element_enum"]);
					foreach($labels as $label) {
						$raw_value = trim(explode(",", $label)[0]);
						$label = trim(explode(",", $label)[1]);
						$html .= <<< EOF
				<tr class="value-row" data-field-name="$field_name">
					<td class="type_column">Answer</td>
					<td class="label_column" data-raw-value="$raw_value">$label</td>
					<td class="value_column">$value_col</td>
				</tr>
EOF;
					}
				}
			}
		}
		
		$html .= '
			</tbody>
		</table>';
		
		$html .= <<< EOF
		<button id="save_changes" class="btn btn-outline-primary" type="button">Save Changes</button>
EOF;
		
		return $html;
	}
	
	// function test
}