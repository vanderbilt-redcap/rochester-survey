// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');

// load dashboard content
$(function() {	
	Rochester.init();
});

var Rochester = {};

Rochester.init = function() {
	var first_vid_url = "";
	if (associatedValues != false) {
		Rochester.values = associatedValues;
		let url = Rochester.values.record_id.field[0];
		let video_id = url.split('v=')[1];
		let ampersandPosition = video_id.indexOf('&');
		first_vid_url = `https://www.youtube.com/embed/` + video_id;
		if(ampersandPosition != -1) {
			first_vid_url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition);
		}
	}
	
	// add video iframe element, survey control div/button, hide most of the #pagecontent and questiontable children children
	$("#pagecontainer").prepend(`
			<div id="survey-video">
				<iframe width="800" height="560" src="` + first_vid_url + `" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
			</div>`);
	$("#survey-video").after(`
			<div id="survey-options">
				<button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#exampleModal">
					Survey Options<i class="fas fa-cog" style="margin-left: 8px"></i>
				</button>
			</div>
			<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
				<div class="modal-dialog" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
							<button type="button" class="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div class="modal-body">
							<div id="signer_buttons">
								${Rochester.getSignerButtons()}
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
							<button type="button" class="btn btn-primary" data-dismiss="modal">Save changes</button>
						</div>
					</div>
				</div>
			</div>
	`);
	$("#container").after(`
			<div id="survey-navigation">
				<button class="btn btn-primary">Back</button>
				<button class="btn btn-primary">Next</button>
			</div>`);
	
	// register events
	$("body").on('click', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('click', "#survey-navigation button:last-child", Rochester.nextClicked);
	$("body").on("click", "#questiontable tr input", Rochester.answerSelected);
	// $("body").on("click", "#survey-options", Rochester.openOptions);
	
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
	// $("body").append(``);
}

Rochester.endSurvey = function() {
	let obname = $("#submit-action").prop("name");
	console.log('ending survey');
	if ($('#form select[name="'+obname+'"]').hasClass('rc-autocomplete') && $('#rc-ac-input_'+obname).length) {
		$('#rc-ac-input_'+obname).trigger('blur');
	}
	// Change form action URL to force it to end the survey
	$('#form').prop('action', $('#form').prop('action')+'&__endsurvey=1' );
	// Submit the survey
	dataEntrySubmit(document.getElementById('submit-action'));
}

Rochester.backClicked = function() {
	let foundNewTarget = false;
	// try to find a suitable previous questiontable tbody tr to display
	$(Rochester.surveyTarget).prevAll().each(function(i, e) {
		if (Rochester.isRealField(e)) {
			$(Rochester.surveyTarget).addClass("unseen");
			Rochester.surveyTarget = e;
			$(e).removeClass("unseen");
			
			// set video to this field's associated video
			let fieldName = $(e).attr('sq_id');
			// console.log(fieldName);
			// if (Rochester.surveyTarget == $("#surveytitlelogo")[0])
				// fieldName = "record_id";
			Rochester.setVideoByFieldName(fieldName);
			
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
		
		Rochester.setVideoByFieldName("record_id");
	}
}

Rochester.nextClicked = function() {
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		// handle case where we're not showing survey contents yet, just survey instructions (e.g., after initialization)
		$("#surveytitlelogo").addClass("unseen");
		$("#surveyinstructions").addClass("unseen");
		$("#pagecontent form").removeClass("unseen");
		$("#survey-navigation button:eq(0)").removeClass("unseen");
		
		$("#questiontable tbody").children().addClass("unseen");
		let foundNewTarget = false;
		$("#questiontable tbody").children().each(function(i, e) {
			if (Rochester.isRealField(e)) {
				Rochester.surveyTarget = e;
				$(e).removeClass("unseen");
				
				// set video to this field's associated video
				let fieldName = $(e).attr('sq_id');
				Rochester.setVideoByFieldName(fieldName);
				
				foundNewTarget = true;
				return false;
			}
		});
		
		// couldn't find any more real fields
		if (!foundNewTarget) {
			Rochester.endSurvey();
		}
	} else {
		let foundNewTarget = false;
		$(Rochester.surveyTarget).nextAll().each(function(i, e) {
			
			if (Rochester.isRealField(e)) {
				$(Rochester.surveyTarget).addClass("unseen");
				Rochester.surveyTarget = e;
				$(e).removeClass("unseen");
				
				// set video to this field's associated video
				let fieldName = $(e).attr('sq_id');
				Rochester.setVideoByFieldName(fieldName);
				
				foundNewTarget = true;
				return false;
			}
		});
		
		if (!foundNewTarget) {
			Rochester.endSurvey();
		}
	}
}

Rochester.setVideoByFieldName = function(fieldName) {
	// set video to this field's associated video
	if (Rochester.values && Rochester.values[fieldName] && Rochester.values[fieldName].field) {
		let url = Rochester.values[fieldName].field[0];
		if (url) {
			let video_id = url.split('v=')[1];
			let ampersandPosition = video_id.indexOf('&');
			let vid_url = `https://www.youtube.com/embed/` + video_id;
			if(ampersandPosition != -1) {
				vid_url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition);
			}
			$("#survey-video iframe").attr("src", vid_url);
		}
	}
}

Rochester.answerSelected = function(e) {
	let fieldName = $(this).closest("tr").attr('sq_id');
	let choiceRawValue = $(this).attr("value");
	if (Rochester.values && Rochester.values[fieldName] && Rochester.values[fieldName].choices && Rochester.values[fieldName].choices[choiceRawValue]) {
		let url = Rochester.values[fieldName].choices[choiceRawValue][0];
		let video_id = url.split('v=')[1];
		let ampersandPosition = video_id.indexOf('&');
		let vid_url = `https://www.youtube.com/embed/` + video_id;
		if(ampersandPosition != -1) {
			vid_url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition);
		}
		$("#survey-video iframe").attr("src", vid_url);
	}
}

Rochester.getSignerButtons = function() {
	if (!Rochester.values)
		return false;
	
	// count how many signers we have (same as columns of associations)
	let signerCount = 1;
	for (var fieldname in Rochester.values) {
		let entry = Rochester.values[fieldname];
		if (entry.field) {
			signerCount = Math.max(signerCount, entry.field.length);
		}
		if (entry.choices) {
			for (var rawValue in entry.choices) {
				signerCount = Math.max(signerCount, entry.choices[rawValue].length);
			}
		}
	}
	// console.log("col max: " + signerCount);
	
	// make and return html buttons
	let html = "";
	for (i = 1; i <= signerCount; i++) {
		html += `<button class="btn btn-primary">Signer ${i}</button>`;
	}
	return html;
}

