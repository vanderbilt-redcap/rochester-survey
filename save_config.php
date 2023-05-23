<?php
$project = new \Project($module->framework->getProjectId());
$data = json_decode($_POST['data'], true);
$filtered = $module->sanitize_video_form_settings($data);

$survey_display_name = $project->forms[$module->framework->escape($filtered["form_name"])]["menu"];

// if user cleared all values from survey config, delete settings in module
if (empty($filtered['instructions_urls']) and
    empty($filtered['signer_urls']) and
    empty($filtered['fields']) and
    empty($filtered['exitModalText']) and
    empty($filtered['exitModalVideo'])) {
        $module->framework->removeProjectSetting($data['form_name']);
        exit('{
            "msg": "Removed all survey settings for ' . print_r($module->framework->escape($survey_display_name), true) . '"
        }');
}

$module->framework->setProjectSetting($filtered["form_name"], json_encode($filtered));
exit('{
    "msg": "Saved settings for ' . print_r($module->framework->escape($survey_display_name), true) . '"
}');