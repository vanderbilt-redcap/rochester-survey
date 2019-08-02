<?php
	$sql = "select message";
	$test = $module->framework->queryLogs($sql);
	print_r($test);