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
	
	// event listening
	$("body").on('click', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('click', "#survey-navigation button:last-child", Rochester.nextClicked);
	
	console.log(Rochester.maxFieldIndex);
	// console.log(Rochester.dataDictionary);
});

var Rochester = {
	"fieldIndex": 0,
	"maxFieldIndex": $("#questiontable > tbody > tr").length
};

Rochester.openOptions = function() {
	
}

Rochester.getFieldInfo = function(fieldRow) {
	
}

Rochester.endSurvey = function() {
	console.log('ending survey');
}

Rochester.backClicked = function() {
	
}

Rochester.nextClicked = function() {
	if (Rochester.hasOwnProperty("targetQuestionRow")) {
		Rochester.targetQuestionRow = Rochester.targetQuestionRow.next("tr:not(.surveysubmit)");
		if (Rochester.targetQuestionRow.length == 0) {
			Rochester.endSurvey();
		} else {
			console.log(Rochester.targetQuestionRow);
		}
	} else {
		Rochester.targetQuestionRow = $("#questiontable > tbody > tr:first-child:not(.surveysubmit)");
		console.log(Rochester.targetQuestionRow);
	}
}