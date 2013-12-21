<?php

$data = "[]";

// This is the local file to echo, wrapped as JSONP. It's being generated on the
// server daily, through the fetch_interpreti_concerts.py script.
define('CONCERTS_JSON', 'concerts.json');

if (file_exists(CONCERTS_JSON)) {
	$data = file_get_contents(CONCERTS_JSON);
}

$callback = $_GET["callback"];

if ($callback && strlen($callback) > 0) {
	echo $_GET["callback"] . "(" . $data . ")";
}
else {
	echo $data;
}
