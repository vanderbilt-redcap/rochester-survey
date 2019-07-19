// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');

// load dashboard content
$(function() {	
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
	$("#pagecontent form").addClass("unseen");
	$("#survey-navigation button:eq(0)").addClass("unseen");
	
	Rochester.surveyTarget = $("#surveytitlelogo")[0];
}

Rochester.isRealField = function(fieldRow) {
	// this function returns false if questiontable row is blank descriptive, has display: none, or sq_id == "{}"
	if (/^\s+$/.test($(fieldRow).find("td:eq(1)").html()) || $(fieldRow).css("display") == "none" || $(fieldRow).attr("sq_id") == "{}" || $(fieldRow).hasClass("surveysubmit")) {
		return false;
	}
	return true;
}

Rochester.openOptions = function() {
	
}

Rochester.endSurvey = function() {
	console.log('ending survey');
}

Rochester.backClicked = function() {
	let foundNewTarget = false;
	// try to find a suitable previous questiontable tbody tr to display
	$(Rochester.surveyTarget).prevAll().each(function(i, e) {
		if (Rochester.isRealField(e)) {
			$(Rochester.surveyTarget).addClass("unseen");
			Rochester.surveyTarget = e;
			$(e).removeClass("unseen");
			foundNewTarget = true;
			return false;
		}
	});
	
	// if we can't find one, unseen the form and surveytarget, show survey instructions, hide back button
	if (!foundNewTarget) {
		// hide
		$(Rochester.surveyTarget).addClass("unseen");
		$("#pagecontent form").addClass("unseen");
		$("#survey-navigation button:eq(0)").addClass("unseen");
		
		// show
		Rochester.surveyTarget = $("#surveytitlelogo")[0];
		$("#surveytitlelogo").removeClass("unseen");
		$("#surveyinstructions").removeClass("unseen");
	}
}

Rochester.nextClicked = function() {
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		// handle case where we're not showing survey contents yet, just survey instructions (e.g., after initialization)
		$("#surveytitlelogo").addClass("unseen");
		$("#surveyinstructions").addClass("unseen");
		$("#pagecontent form").removeClass("unseen");
		
		$("#questiontable tbody").children().addClass("unseen");
		
		$("#questiontable tbody").children().each(function(i, e) {
			if (Rochester.isRealField(e)) {
				Rochester.surveyTarget = e;
				$(e).removeClass("unseen");
				return false;
			}
		});
	} else {
		let foundNewTarget = false;
		$(Rochester.surveyTarget).nextAll().each(function(i, e) {
			if (Rochester.isRealField(e)) {
				$(Rochester.surveyTarget).addClass("unseen");
				Rochester.surveyTarget = e;
				$(e).removeClass("unseen");
				foundNewTarget = true;
				return false;
			}
		});
		
		if (!foundNewTarget) {
			// end survey
			Rochester.endSurvey();
		}
	}
}