<?php
$project = new \Project($module->framework->getProjectId());
$data = json_decode($_POST['data'], true);
$filtered = [
    "signer_urls" => [],
    "instructions_urls" => [],
    "fields" => []
];
$filtered['form_name'] = filter_var($data['form_name'], FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
$survey_display_name = $project->forms[$filtered["form_name"]]["menu"];

// if user cleared all values from survey config, delete settings in module
if (empty($data['instructions_urls']) and
    empty($data['signer_urls']) and
    empty($data['fields']) and
    empty($data['exitModalText']) and
    empty($data['exitModalVideo'])) {
        $module->framework->removeProjectSetting($data['form_name']);
        exit('{
            "msg": "Removed all survey settings for ' . print_r($survey_display_name, true) . '"
        }');
}

// sanitize JSON -- starting with non-url fields
$filtered['exitModalText'] = filter_var($data['exitModalText'], FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
$filtered['exitModalVideo'] = filter_var($data['exitModalVideo'], FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);

// sanitize instructions urls
foreach($data['instructions_urls'] as $i => $url) {
    $filtered['instructions_urls'][$i] = filter_var($url, FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
}
// sanitize signer urls
foreach($data['signer_urls'] as $i => $url) {
    $filtered['signer_urls'][$i] = filter_var($url, FILTER_SANITIZE_STRING, FILTER_NULL_ON_FAILURE);
}

// sanitize field/choice URLs
foreach ($data['fields'] as $field_name => $field_arr) {
    $filtered['fields'][$field_name] = [];
    if (isset($field_arr['field'])) {
        $filtered['fields'][$field_name]['field'] = [];
        foreach ($field_arr['field'] as $i => $url) {
            $filtered['fields'][$field_name]['field'][$i] = filter_var($url, FILTER_VALIDATE_URL, FILTER_NULL_ON_FAILURE);
        }
    }
    if (isset($field_arr['choices'])) {
        $filtered['fields'][$field_name]['choices'] = [];
        foreach ($field_arr['choices'] as $raw_value => $choice_arr) {
            $filtered['fields'][$field_name]['choices'][$raw_value] = [];
            foreach ($choice_arr as $i => $url) {
                $filtered['fields'][$field_name]['choices'][$raw_value][$i] = filter_var($url, FILTER_VALIDATE_URL, FILTER_NULL_ON_FAILURE);
            }
        }
    }
}

// retrieve endOfSurveyImage edoc_id if set, (this makes sure we don't write null over it)
$settings = $module->framework->getProjectSetting($filtered["form_name"]);
if (!empty($settings))
	$settings = json_decode($settings, true);

$filtered['endOfSurveyImage'] = $settings['endOfSurveyImage'];

$module->framework->setProjectSetting($filtered["form_name"], json_encode($filtered));

exit('{
    "msg": "Saved settings for ' . print_r($survey_display_name, true) . '"
}');