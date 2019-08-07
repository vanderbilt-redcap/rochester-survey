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
		
		// $emLog = $this->framework->query("select * from redcap_external_modules_log_parameters WHERE name='field-value-associations' ORDER BY log_id DESC LIMIT 1");
		// $record = db_fetch_assoc($emLog);
		// $prevSettings = "var associatedValues = false;";
		// if (!empty($record["value"])) {
			// $prevSettings = "var associatedValues = JSON.parse(`{$record["value"]}`);";
		// }
		
		$sql = "select log_id from redcap_external_modules_log_parameters where name='form-name' and value='$instrument' order by log_id desc limit 1";
		$log_id = db_fetch_assoc(db_query($sql))["log_id"];
		$result = "var associatedValues = false;";
		if (!empty($log_id)) {
			$sql = "select value from redcap_external_modules_log_parameters where name='form-field-value-associations' and log_id=$log_id";
			$result = db_result(db_query($sql));
			if (!empty($result)) {
				$result = "var associatedValues = JSON.parse(`$result`);";
			}
		}
		
		$ds = DIRECTORY_SEPARATOR;
		$url1 = $this->getUrl("js/survey.js");
		$url2 = $this->getUrl("css/survey.css");
		$survey_script = file_get_contents($url1);
		$survey_script = str_replace("CSS_URL", $url2, $survey_script);
		$injection_element = "
		<!-- Rochester survey interface module -->
		<script type=\"text/javascript\">
			$result
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
		
		$sql = "select log_id from redcap_external_modules_log_parameters where name='form-name' and value='$form_name' order by log_id desc limit 1";
		$log_id = db_fetch_assoc(db_query($sql))["log_id"];
		$columns = 1;
		if (!empty($log_id)) {
			$sql = "select value from redcap_external_modules_log_parameters where name='form-field-value-associations' and log_id=$log_id";
			// $associations = json_decode(db_fetch_assoc(db_query($sql))["form-field-value-associations"], true);
			$result = db_query($sql);
			$associations = json_decode(db_result($result), true);
			foreach($associations as $field) {
				if (!empty($field["field"])) {
					$columns = max($columns, count($field["field"]));
				}
				if (!empty($field["choices"])) {
					foreach($field["choices"] as $set) {
						$columns = max($columns, count($set));
					}
				}
			}
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
		<table id="assoc_table" class="field_value" data-form-name="' . $form_name . '">
			<thead>
				<th class="type_column">Type</th>
				<th class="var_column">Variable</th>
				<th class="label_column">Label</th>';
		for ($col = 1; $col <= $columns; $col++) {
			$html .= "
				<th class='value_column'>
					<div>
						<span>Value ($col)</span>";
			
			if ($col > 1) {
				$html .= "
						<button class='btn btn-outline-secondary remove_column'>
							Remove
						</button>";
			}
			
			$html .= "
					</div>
				</th>";
		}
		$html .= '
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
					$type_col = "Field (" . $project->metadata[$field_name]["element_type"] . ")";
				}
				$html .= "
				<tr class='value-row' data-field-name='$field_name'>
					<td class='type_column'>$type_col</td>
					<td class='var_column'>[$field_name]</td>
					<td class='label_column'>$label_col</td>";
				
				for ($col = 1; $col <= $columns; $col++) {
					$input_value = $value_col;
					if (!empty($associations[$field_name]["field"][$col- 1])) {
						$temp_value = $associations[$field_name]["field"][$col - 1];
						$input_value = "<input type='text' class='form-control' value='$temp_value' placeholder='Value' aria-label='Associated value' aria-describedby='basic-addon1'>";
					}
					$html .= "
					<td class='value_column'>$input_value</td>";
				}
				
				$html .= '
				</tr>';
				$type_col = "Answer";
				// preg_match_all("/\,\s*?(.+)\s*?(?:\\n|$)/mgU", $project->metadata[$field_name]["element_enum"], $matches);
				if (!empty($project->metadata[$field_name]["element_enum"])) {
					$labels = explode("\\n", $project->metadata[$field_name]["element_enum"]);
					foreach($labels as $label) {
						$raw_value = trim(explode(",", $label)[0]);
						$label = trim(explode(",", $label)[1]);
						$html .= "
				<tr class='value-row' data-field-name='$field_name'>
					<td class='type_column'>Choice</td>
					<td class='var_column'>[$field_name][$raw_value]</td>
					<td class='label_column' data-raw-value='$raw_value'>$label</td>";
				
				for ($col = 1; $col <= $columns; $col++) {
					$input_value = $value_col;
					if (!empty($associations[$field_name]["choices"][$raw_value][$col- 1])) {
						$temp_value = $associations[$field_name]["choices"][$raw_value][$col - 1];
						$input_value = "<input type='text' class='form-control' value='$temp_value' placeholder='Value' aria-label='Associated value' aria-describedby='basic-addon1'>";
					}
					$html .= "
					<td class='value_column'>$input_value</td>";
				}
				
				$html .= "
				</tr>";
					}
				}
			}
		}
		
		$html .= "
			</tbody>
		</table>";
		
		$html .= "
		<button id='save_changes' class='btn btn-outline-primary' type='button'>Save Changes</button>";
		
		return $html;
	}
	
	// function test
}