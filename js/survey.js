// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');

// load dashboard content
$(function() {
	// append bootstrap js to document
	// let s = document.createElement("script");
    // s.type = "text/javascript";
    // s.src = "BOOTSTRAP_URL";
    // $("head").append(s);
	
	// add dashboard html
	// $("body").append(SURVEY_HTML);
	
	Rochester.init();
});

var Rochester = {};

Rochester.init = function() {
	// add video iframe element, survey control div/button, hide most of the #pagecontent and questiontable children children
	$("#pagecontainer").prepend(`
			<div id="survey-video">
				<iframe width="560" height="315" src="https://www.youtube.com/embed/ZEUeujtc4rY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
			</div>`);
	$("#survey-video").after(`
			<div id="survey-options">
				<button class="btn btn-secondary">Survey Options<i class="fas fa-cog" style="margin-left: 8px"></i></button>
			</div>`);
	$("#container").after(`
			<div id="survey-navigation">
				<button class="btn btn-primary">Back</button>
				<button class="btn btn-primary">Next</button>
			</div>`);
	
	// register events
	$("body").on('click', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('click', "#survey-navigation button:last-child", Rochester.nextClicked);
	
	// hide most of #pagecontent (except surveytitlelogo and instructions)
	$("#pagecontent").children().hide();
	$("#surveytitlelogo").show();
	$("#surveyinstructions").show();
	
	$("#survey-navigation button:eq(0)").hide();
	
	Rochester.surveyTarget = $("#surveytitlelogo")[0];
}

Rochester.isRealField = function(fieldRow) {
	// this function returns false if questiontable row is blank descriptive, has display: none, or sq_id == "{}"
	console.log(fieldRow);
	console.log($(fieldRow));
	console.log(/^\s+$/.test($(fieldRow).find("td:eq(1)").html()));
	console.log($(fieldRow).css("display") == "none");
	console.log($(fieldRow).attr("sq_id") == "{}");
	console.log($(fieldRow).hasClass("surveysubmit"));
	if (!/^\s+$/.test($(fieldRow).find("td:eq(1)").html()) || $(fieldRow).css("display") == "none" || $(fieldRow).attr("sq_id") == "{}" || $(fieldRow).hasClass("surveysubmit")) {
		return false;
	}
	return true;
}

Rochester.openOptions = function() {
	
}

Rochester.getFieldInfo = function(fieldRow) {
	let info = {};
	info.questionNumber = $(fieldRow).children(".questionnum").text();
	let fieldName = $(fieldRow).attr('id').replace("-tr", "");
	info.questionText = $("#label-" + fieldName).text(); 
	console.log(info);
}

Rochester.endSurvey = function() {
	console.log('ending survey');
}

Rochester.backClicked = function() {
	
}

Rochester.nextClicked = function() {
	console.log(Rochester.surveyTarget);
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		// handle case where we're not showing survey contents yet, just survey instructions (e.g., after initialization)
		console.log("survey target is title logo");
		$("#surveytitlelogo").hide();
		$("#surveyinstructions").hide();
		
		$("#pagecontent form").show();
		$("#questiontable tbody").children().hide();
		
		$("#questiontable tbody").children().each(function(i, e) {
			if (i < 5) {
				// console.log(e);
			} else {
				return false;
			}
			if (Rochester.isRealField(e)) {
				console.log("found real field: " + e);
				Rochester.surveyTarget = e;
				$(e).show();
				return false;
			}
		});
	} else {
		console.log (Rochester.surveyTarget + "\n not equal to \n" + $("#surveytitlelogo"));
	}
	
	if (Rochester.hasOwnProperty("targetQuestionRow")) {
		Rochester.targetQuestionRow = Rochester.targetQuestionRow.next("tr:not(.surveysubmit)");
		if (Rochester.targetQuestionRow.length == 0) {
			Rochester.endSurvey();
		} else {
			console.log(Rochester.targetQuestionRow);
		}
	} else {
		// Rochester.targetQuestionRow = $("#questiontable > tbody > tr:first-child:not(.surveysubmit)");
		// console.log(Rochester.targetQuestionRow);
	}
}