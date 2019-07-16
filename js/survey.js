// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');

// load dashboard content
$(function() {
	// append bootstrap js to document
	let s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "BOOTSTRAP_URL";
    $("head").append(s);
	
	// add dashboard html
	$("body").append(SURVEY_HTML);
	
	$("body").on('click', "#survey-options", Rochester.openOptions);
	
	console.log(Rochester.maxFieldIndex);
	// console.log(Rochester.dataDictionary);
});

var Rochester = {
	"fieldIndex": 0,
	"maxFieldIndex": $("#questiontable > tbody > tr").length
};

Rochester.openOptions = function() {
	
}

Rochester.getNextFieldArray = function() {
	this.field++;
}

Rochester.endSurvey = function() {
	
}