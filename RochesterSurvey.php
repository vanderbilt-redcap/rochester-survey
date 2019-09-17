<?php
namespace Vanderbilt\RochesterSurvey;

class RochesterSurvey extends \ExternalModules\AbstractExternalModule {
	function redcap_survey_complete($project_id, $record, $instrument, $event_id, $group_id, $survey_hash, $response_id, $repeat_instance) {
		$form_name = $instrument;
		
		// fetch end of survey image configured for this form (if there is one)
		$img = null;
		$settings = $this->framework->getProjectSetting($instrument);
		if (empty($settings))
			return;
		
		$settings = json_decode($settings, true);
		$edoc_id = $settings['endOfSurveyImage'];
		if (!empty($edoc_id)) {
			$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$edoc_id";
			$result = db_query($sql);
			if ($row = db_fetch_assoc($result)) {
				$encodedImage = base64_encode(file_get_contents(EDOC_PATH . $row["stored_name"]));
				$imgSrc = "data: {$row["mime_type"]};base64,$encodedImage";
				$img = "<img src='$imgSrc'>";
			}
		}
		
		echo "
		<script type='text/javascript'>
			$('#pagecontent > div:first > div:eq(0)').append(`<br/><br/>$img`);
			$('#pagecontent > div:first > div:eq(0) img').css('max-width', '100%');
		</script>";
	}
	
	function redcap_every_page_top($pid) {
		echo "
		<script type='text/javascript'>
			$('body').css('display', 'none');
			$(function() {
				$('body').css('display', 'block');
			});
		</script>";
	}
	
	function redcap_survey_page($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $survey_hash, $response_id = NULL, $repeat_instance = 1) {
		?>
		<link rel="stylesheet" type="text/css" href="<?=$this->getUrl("css/survey.css")?>">
		<link rel="stylesheet" type="text/css" href="<?=$this->getUrl("spectrum/spectrum.css")?>">
		<script src="<?=$this->getUrl("spectrum/spectrum.js")?>"></script>
		<?php
		// get this instrument's associated field values
		$result = $this->framework->getProjectSetting($instrument);
		if ($result === null)
			return null;
		$result = "var associatedValues = JSON.parse(`$result`);";
		
		$url1 = $this->getUrl("js/survey.js");
		$url3 = $this->getUrl("survey_ajax.php");
		$survey_script = file_get_contents($url1);
		$survey_script = str_replace("KEYBOARD_CSS", $keyboard_css_url, $survey_script);
		$survey_script = str_replace("SURVEY_AJAX_URL", $url3, $survey_script);
		$injection_element3 = "
		<!-- Rochester survey interface module -->
		<script type=\"text/javascript\">
			$result
			$survey_script
		</script>";
		
		echo($injection_element3);
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
		
		$settings = $this->framework->getProjectSetting($form_name);
		if (!empty($settings)) {
			$settings = json_decode($settings, true);
			$associations = $settings['fields'];
			$columns = 1;
			$columns = max($columns, count($settings["signer_urls"]));
			$columns = max($columns, count($settings["instructions_urls"]));
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
		
		
		// we'll want at least one value column and signer upload input
		$columns = max(1, $columns);
		
		$html .= '
		<h5>Survey Instrument Configuration</h5>
		
		<h6>Field and Answer Video Association</h6>
		<p>Enter Youtube video URLs for each field and answer.</p>
		<div id="table-controls">
			<div class="custom-control custom-switch">
				<input type="checkbox" class="custom-control-input" checked="true" id="applyToDuplicates">
				<label class="custom-control-label" for="applyToDuplicates">Duplicate values for fields and answers with identical labels (per column)</label>
			</div>
			<br>
			<button class="btn btn-outline-primary" type="button" id="add_value_col">
				Add Signer
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
						<span>Signer ($col) Video URLs</span>";
			
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
		$html .= "
			</thead>
		<tbody id='field_value_assoc'>
			<tr class='value-row signer-previews'>
				<td class='type_column'>Signer</td>
				<td class='var_column'>N/A</td>
				<td class='label_column'>URL for this signer's preview video</td>";
		
		for ($col = 1; $col <= $columns; $col++) {
			$value = $settings['signer_urls'][$col - 1];
			$html .= "
				<td class='value_column'>
					<input type='text' class='form-control' value='$value' placeholder='http://youtu.be/abc123' aria-label='Associated value' aria-describedby='basic-addon1'>
				</td>";
		}
		
		$html .= "
			</tr>
			<tr class='value-row instructions-urls'>
				<td class='type_column'>Survey Instructions</td>
				<td class='var_column'>N/A</td>
				<td class='label_column'>URL for the video that will show when the participant is shown the survey instructions</td>";
		
		for ($col = 1; $col <= $columns; $col++) {
			$value = $settings['instructions_urls'][$col - 1];
			$html .= "
				<td class='value_column'>
					<input type='text' class='form-control' value='$value' placeholder='URL' aria-label='Associated value' aria-describedby='basic-addon1'>
				</td>";
		}
		
		foreach($form["fields"] as $field_name => $field) {
			if (!empty($field) and \REDCap::getRecordIdField() != $field_name) {
				$value_col = "<input type=\"text\" class=\"form-control\" placeholder=\"URL\" aria-label=\"Associated value\" aria-describedby=\"basic-addon1\">";
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
						$input_value = "<input type='text' class='form-control' value='$temp_value' placeholder='URL' aria-label='Associated value' aria-describedby='basic-addon1'>";
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
						$input_value = "<input type='text' class='form-control' value='$temp_value' placeholder='URL' aria-label='Associated value' aria-describedby='basic-addon1'>";
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
		
		$exitSurveyText = $settings['exitModalText'];
		$exitSurveyVideo = $settings['exitModalVideo'];
		
		$html .= '
		<h6>Exit Survey Modal</h6>
		<div id="exit-modal-config">
			<div class="form-group">
				<label for="exitModalTextInput">Text shown to participant in Exit Survey modal:</label>
				<textarea type="text" class="form-control" id="exitModalTextInput" aria-describedby="exitModalText" rows="3" placeholder="Click `Exit` to exit this survey...">' . $exitSurveyText . '</textarea>
			</div>
			<div class="form-group">
				<label for="exitVideoUrl">Video URL for accompanying video:</label>
				<input type="text" class="form-control" id="exitVideoUrl" aria-describedby="exitModalVideo" value="' . $exitSurveyVideo . '" placeholder="http://www.youtube.com/..."></textarea>
			</div>
		</div>';
		
		// fetch end of survey image configured for this form (if there is one)
		$img = null;
		$delete_button = null;
		$edoc_id = $settings['endOfSurveyImage'];
		if (!empty($edoc_id)) {
			$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id=$edoc_id";
			$result = db_query($sql);
			if ($row = db_fetch_assoc($result)) {
				$encodedImage = base64_encode(file_get_contents(EDOC_PATH . $row["stored_name"]));
				$imgSrc = "data: {$row["mime_type"]};base64,$encodedImage";
				$img = "<img src='$imgSrc'>";
				$delete_button = "<button type='button' class='btn btn-outline-danger'>Delete</button>";
			}
		}
		
		$html .= "
		<h6>End of Survey Image/Logo</h6>
		<div id='end-of-survey-config'>
			<div class='image-upload logo-upload'>
				$img
				<div class='row'>
					<h6>Image/Logo</h6>
					$delete_button
				</div>
				<div class='input-group'>
					<div class='custom-file'>
						<input type='file' class='custom-file-input' id='logo-input' aria-describedby='upload'>
						<label class='custom-file-label text-truncate' for='logo-input'>Choose image</label>
					</div>
				</div>
			</div>
		</div>
		";
		
		$html .= "
		<button id='save_changes' class='btn btn-outline-primary' type='button'>Save Changes</button>";
		
		return $html;
	}
	
	function getSignerPortraits($form_name) {
		// get portraits info from module settings
		$portraits = json_decode($this->framework->getProjectSetting("portraits"), true);
		foreach ($portraits as $name => $set) {
			if ($name !== $form_name)
				unset($portraits[$name]);
		}
		$edoc_ids = [];
		foreach ($portraits[$form_name] as $portraitIndex => $edoc_id) {
			if (!empty($edoc_id)) {
				$edoc_ids[] = $edoc_id;
			}
		}
		
		if (!empty($edoc_ids)) {
			$edoc_ids = "(" . implode($edoc_ids, ", ") . ")";
			$sql = "SELECT * FROM redcap_edocs_metadata WHERE doc_id in $edoc_ids";
			$result = db_query($sql);
			while ($row = db_fetch_assoc($result)) {
				foreach ($portraits[$form_name] as $portraitIndex => $edoc_id) {
					if ($edoc_id == $row["doc_id"]) {
						$encodedImage = base64_encode(file_get_contents(EDOC_PATH . $row["stored_name"]));
						$imgSrc = "data: {$row["mime_type"]};base64,$encodedImage";
						$portraits[$form_name][$portraitIndex] = "<img src='$imgSrc'>";
					}
				}
			}
		}
		
		if (empty($portraits)) {
			return false;
		}
		
		return $portraits;
	}
}