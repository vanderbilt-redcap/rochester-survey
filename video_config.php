<?php
require_once str_replace("temp\\", "", APP_PATH_TEMP) . "redcap_connect.php";
require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
?>
<div>
	<h5>Survey Video Configuration</h5>
</div>
<?php

echo("<pre>");
print_r(get_object_vars($module));
echo("</pre>");

require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

?>