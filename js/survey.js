// include css and bootstrap
// $('head').append('<link rel="stylesheet" type="text\css" href="KEYBOARD_CSS">');

$('head').append('<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">');
$('head').append('<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.0/themes/ui-lightness/jquery-ui.css" rel="stylesheet">');

  // Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.id = 'survey-video-script';
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // Replace the 'videoIframe' element with an <iframe> and
  // YouTube player after the API code downloads.
var player;
var player2;
function onYouTubeIframeAPIReady() {
	player2 = new YT.Player('exitVideoIframe', {
		playerVars: {
			autoplay: 1,
			modestbranding: 1
		}
	});
}

function onYouTubePlayerAPIReady() {
	player = new YT.Player('ytplayer', {
		height: '560',
		width: '800',
		videoId: '8tPnX7OPo0Q', // init blank video
		playerVars: {
			modestbranding: 1,
			playsinline: 1,
			rel: 0,
			showinfo: 0
		},
		events: {
			onStateChange: function(target, data){
				// if (target.data == YT.PlayerState.ENDED || target.data == YT.PlayerState.PAUSED) { // if paused or video ended
				if (target.data == YT.PlayerState.ENDED) {
					if (!Rochester.curtain.locked) {
						$("#curtain h5").text("Click to play video.");
						// $("#curtain").css('height', '88%');
						$("#curtain").show();
					}
				} else {
					if (!Rochester.curtain.locked) {
						// console.log("showing curtain from event yt player state changed");
						$("#curtain").hide();
					}
				}
			}
		}
	});
	console.log('player instantiated:', player);
}

var Rochester = {
	curtain: {
		locked: false
	}
};

// load dashboard content
$(function() {
	$('body').css('display', 'block');
	Rochester.init();
	Rochester.ajaxURL = "SURVEY_AJAX_URL";
	
	// console.log('loaded');
	// setTimeout(function(){
		// console.log('loading next video')
		// player.loadVideoById('kTvHIDKLFqc')
	// }, 5000)
});

Rochester.init = function() {
	Rochester.signerIndex = 0;
	Rochester.surveyTarget = $("#surveytitlelogo")[0];
	Rochester.values = associatedValues;
	Rochester.countSigners();
	
	// add video button to field labels
	$(".fl").each(function(i, e) {
		$(e).after('<button type="button" class="btn btn-outline-primary fl-button">\
				<span>Watch Question Video<span><i class="fas fa-video"></i>\
			</button>');
	});
	
	// add video iframe element, survey control div/button, hide most of the #pagecontent and questiontable children children
	$("#pagecontainer").prepend('\
			<div id="survey-video">\
				<div id="curtain">\
					<h5>No video associated with this question or answer</h5>\
				</div>\
				<div id="ytplayer"></div>\
			</div>');
	
	// <iframe id="videoIframe" width="800" height="560" src="` + first_vid_url + "?enablejsapi=1&rel=0&start=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en" + `" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen</iframe>
	
	// add exit survey iframe video too
	$("body").append(Rochester.getExitModalHtml());
	
	// add options modal
	$("#container").before(Rochester.getOptionsModalHtml());
	
	// add survey navigation buttons
	$("#container").after('\
			<div id="survey-navigation">\
				<button class="btn btn-primary">Back</button>\
				<button class="btn btn-primary">Next</button>\
			</div>');
	
	// spectrum color picker creation/initialization
	$("#spectrum_bg_color").spectrum({
		color: "#FFF",
		flat: true,
		showButtons: false,
		move: function(color) {
			$("body").css("background-color", color.toHexString());
			$("html").css("background-color", color.toHexString());
			$("#pagecontent").css("background-color", color.toHexString());
			$("#pagecontent").css("margin-top", "0px");
		}
	});
	$("#spectrum_text_color").spectrum({
		color: "#FFF",
		flat: true,
		showButtons: false,
		move: function(color) {
			$("#container").css("color", color.toHexString());
			$("#container").css("border", "2px solid " + color.toHexString());
			$(".fl-button").contents().addBack(".fl-button").css("color", color.toHexString());
			$(".fl-button").contents().addBack(".fl-button").css("border-color", color.toHexString());
			$("#pagecontent").css("margin-top", "0px");
		}
	});
	
	// hide most of #pagecontent (except surveytitlelogo and instructions)
	$("#pagecontent form").addClass("unseen");
	$("#survey-navigation button:eq(0)").addClass("unseen");
	
	// register events
	$("body").on('mouseup', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('mouseup', "#survey-navigation button:last-child", Rochester.nextClicked);
	$("body").on('click touchstart', "#survey-options button.video", Rochester.videoButtonClicked);
	$("body").on('click touchstart', "#survey-options button:last-child", Rochester.exitClicked);
	
	// $("body").on("click", "#questiontable tr input", Rochester.answerSelected);
	$("body").on("click touchstart", "#questiontable tr [class^=choice]", Rochester.answerSelected);
	
	// play first video when signer select modal closes
	$("body").on("click", ".signer-portrait", Rochester.signerButtonClicked);
	$("body").on('#signerModal hidden.bs.modal', Rochester.initializeSigner); // (when closed by clicking outside of modal)
	
	$("body").on("click touchstart", "#curtain", function() {
		if (!Rochester.curtain.locked) {
			// console.log("showing curtain from event #curtain clicked");
			$("#curtain").hide();
			player.playVideo();
		}
	});
	
	
	$("#fontSizeSlider").on("change", function() {
		var zoom = $("#fontSizeSlider").val() + "%";
		$("html").css("zoom", zoom);
		$("#spectrum_color_picker").spectrum({
			color: "#FFF",
			flat: true,
			showButtons: false,
			move: function(color) {
				$("body").css("background-color", color.toHexString());
				$("html").css("background-color", color.toHexString());
			}
		});
	});
	
	// allow users to load question video after selecting answers
	$("body").on("click touchstart", ".fl-button", function(target) {
		// set video to this field's associated video
		var fieldName = $(Rochester.surveyTarget).attr('sq_id');
		Rochester.setVideoByFieldName(fieldName);
	});
	
	// yt player controls listen
	// $("body").on('change', '#ytCaptions, #ytVolume', function() {Rochester.useYtControls = true});
	
	// exit survey modal Exit button
	$("body").on("click touchstart", "#exitSurveyButton", function() {
		dataEntrySubmit(document.getElementById('submit-action'));
	});
	
	// font resize buttons available in Survey Options modal
	$("#changeFont").hide();
	$("body").on("click touchstart", ".shrinkFont", function() {
		$(".decreaseFont").trigger("click");
	});
	$("body").on("click touchstart", ".growFont", function() {
		$(".increaseFont").trigger("click");
	});
	
	// add on-screen keyboards to textareas
	// $("textarea").each(function(i, e) {
		// $(e).keyboard({});
	// });
	
	// prompt user to select a signer
	Rochester.openSignerModal();
}

Rochester.getVidIdFromUrl = function(url) {
	// thanks to https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
	var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	var match = url.match(regExp);
	if (match && match[2].length == 11) {
	  return match[2];
	} else {
	  //error
	}
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
	var obname = $("#submit-action").prop("name");
	if ($('#form select[name="'+obname+'"]').hasClass('rc-autocomplete') && $('#rc-ac-input_'+obname).length) {
		$('#rc-ac-input_'+obname).trigger('blur');
	}
	// Change form action URL to force it to end the survey
	$('#form').prop('action', $('#form').prop('action')+'&__endsurvey=1' );
	// Submit the survey
	dataEntrySubmit(document.getElementById('submit-action'));
}

Rochester.backClicked = function() {
	var foundNewTarget = false;
	// try to find a suitable previous questiontable tbody tr to display
	$(Rochester.surveyTarget).prevAll().each(function(i, e) {
		if (Rochester.isRealField(e)) {
			// hide/show field
			$(Rochester.surveyTarget).addClass("unseen");
			Rochester.surveyTarget = e;
			$(e).removeClass("unseen");
			
			// set video to this field's associated video
			var fieldName = $(e).attr('sq_id');
			Rochester.setVideoByFieldName(fieldName);
			
			$.ajax({
				method: "POST",
				url: Rochester.ajaxURL,
				data: {
					action: "field changed",
					message: "user navigated backwards to field '" + fieldName + "'"
				},
				dataType: "json"
			}).done(function(msg) {
				
			});
			
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
	var setSurveyToField = function(field) {
		// hide/show field elements
		$(Rochester.surveyTarget).addClass("unseen");
		Rochester.surveyTarget = field;
		$(field).removeClass("unseen");
		
		// set video to this field's associated video
		var fieldName = $(field).attr('sq_id');
		var vidFound = Rochester.setVideoByFieldName(fieldName);
		
		// log field change on server
		$.ajax({
			method: "POST",
			url: Rochester.ajaxURL,
			data: {
				action: "field changed",
				message: "user navigated forward to field '" + fieldName + "'"
			},
			dataType: "json"
		}).done(function(msg) {
			
		});
	}
	
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		// handle case where we're not showing survey contents yet, just survey instructions (e.g., after initialization)
		$("#surveytitlelogo").addClass("unseen");
		$("#surveyinstructions").addClass("unseen");
		$("#pagecontent form").removeClass("unseen");
		$("#survey-navigation button:eq(0)").removeClass("unseen");
		
		$("#questiontable tbody").children().addClass("unseen");
		var foundNewTarget = false;
		$("#questiontable tbody").children().each(function(i, e) {
			if (Rochester.isRealField(e)) {
				
				setSurveyToField(e);
				
				foundNewTarget = true;
				return false;
			}
		});
		
		// couldn't find any more real fields
		if (!foundNewTarget) {
			Rochester.endSurvey();
		}
	} else {
		var foundNewTarget = false;
		$(Rochester.surveyTarget).nextAll().each(function(i, e) {
			
			if (Rochester.isRealField(e)) {
				
				setSurveyToField(e);
				
				foundNewTarget = true;
				return false;
			}
		});
		
		if (!foundNewTarget) {
			Rochester.endSurvey();
		}
	}
}

Rochester.videoButtonClicked = function() {
	var html = $(this).html();
	if (html.search("Hide") != -1) {
		html = html.replace("Hide", "Show")
		html = html.replace("video-slash", "video")
		$(this).html(html);
		player.pauseVideo();
		$("#survey-video").css('display', 'none');
	} else {
		html = html.replace("Show", "Hide")
		html = html.replace("video", "video-slash")
		$(this).html(html);
		player.playVideo();
		$("#survey-video").css('display', 'flex');
	}
}

Rochester.countSigners = function() {
	if (!Rochester.values.fields) {
		Rochester.signerCount = 0;
		return false;
	}
	
	// count how many signers we have (same as columns of associations)
	var signerCount = 1;
	for (var fieldname in Rochester.values.fields) {
		var entry = Rochester.values.fields[fieldname];
		if (entry.field) {
			signerCount = Math.max(signerCount, entry.field.length);
		}
		if (entry.choices) {
			for (var rawValue in entry.choices) {
				signerCount = Math.max(signerCount, entry.choices[rawValue].length);
			}
		}
	}
	Rochester.signerCount = signerCount;
}

Rochester.getSignerVideos = function() {
	// make and return html buttons
	// var html = "";
	// for (i = 1; i <= Rochester.signerCount; i++) {
		// var img = signer_portraits[i] ? signer_portraits[i] : "<i class=\"fas fa-portrait\"></i>";
		// html += '\
					// <div class="signer-portrait close-on-select" data-signer-index="' + (i-1) + '">\
						// ' + img + '\
						// <button type="button" class="btn btn-primary">Signer ' + i + '</button>\
					// </div>';
	// }
	// return html;
}

Rochester.openSignerModal = function() {
	var html = '\
	<div class="modal fade" id="signerModal" tabindex="-1" role="dialog" aria-labelledby="signerModalLabel" aria-hidden="true">\
		<div class="modal-dialog" role="document">\
			<div class="modal-content">\
				<div class="modal-header">\
					<h5 class="modal-title" id="signerModalLabel">Choose a Signer</h5>\
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">\
						<span aria-hidden="true">&times;</span>\
					</button>\
				</div>\
				<div class="modal-body" id="signer-portraits">';
	
	// for (i = 1; i <= Rochester.signerCount; i++) {
		// html += `
					// <div class='signer-portrait close-on-select'>
						// ` + signer_portraits[i] + `
						// <button type="button" class="btn btn-primary">Signer ` + i + `</button>
					// </div>`;
	// }
	
	// html += Rochester.getSignerButtons();
	
	html += '\
				</div>\
				<div class="modal-footer">\
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>\
				</div>\
			</div>\
		</div>\
	</div>';
	
	$("body").prepend(html);
	$("#signerModal").modal('show');
}

Rochester.signerButtonClicked = function() {
	Rochester.signerIndex = $(this).data('signer-index')

	var modal = $(this).closest('.modal');
	modal.modal('hide');
}

Rochester.initializeSigner = function() {	
	if(Rochester.signerIndex === undefined){
		Rochester.signerIndex = 0
	}

	var modal = $(this).closest('.modal');
	if (modal.attr('id') == 'signerModal') {
		if (!Rochester.curtain.locked) {
			$("#curtain").hide();
		}
	}
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		Rochester.setVideoByFieldName("record_id");
	} else {
		var fieldName = $(Rochester.surveyTarget).attr('sq_id');
		Rochester.setVideoByFieldName(fieldName);
	}
	player.seekTo(0);
	
	$.ajax({
		method: "POST",
		url: Rochester.ajaxURL,
		data: {
			action: "signer changed",
			message: "user selected signer " + Rochester.signerIndex
		},
		dataType: "json"
	}).done(function(msg) {
		
	});
}

Rochester.getOptionsModalHtml = function() {
	return '\
			<div id="survey-options">\
				<button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#optionsModal">\
					Survey Options<i class="fas fa-cog" style="margin-left: 8px"></i>\
				</button>\
				<button type="button" class="btn btn-secondary video">\
					Hide Video<i class="fas fa-video-slash" style="margin-left: 8px"></i>\
				</button>\
				<button type="button" class="btn btn-danger">\
					Exit Survey<i class="far fa-times-circle" style="margin-left: 8px"></i>\
				</button>\
			</div>\
			<div class="modal fade" id="optionsModal" tabindex="-1" role="dialog" aria-labelledby="optionsModalLabel" aria-hidden="true">\
				<div class="modal-dialog" role="document">\
					<div class="modal-content">\
						<div class="modal-header">\
							<h5 class="modal-title" id="optionsModalLabel">Survey Options</h5>\
							<button type="button" class="close" data-dismiss="modal" aria-label="Close">\
								<span aria-hidden="true">&times;</span>\
							</button>\
						</div>\
						<div class="modal-body">\
							<h5>Choose a Signer</h5>\
							<div class="row justify-content-around">\
							</div>\
							<h5>Adjust Colors</h5>\
							<div class="row justify-content-around">\
								<div class="col text-center">\
									<h5>Background Color</h5>\
									<input id="spectrum_bg_color">\
								</div>\
								<div class="col text-center">\
									<h5>Text Color</h5>\
									<input id="spectrum_text_color">\
								</div>\
							</div>\
							<h5>Adjust Text Size</h5>\
							<div class="row justify-content-around">\
								<button type="button" class="btn btn-outline-primary shrinkFont">Make Text Smaller</button>\
								<button type="button" class="btn btn-outline-primary growFont">Make Text Bigger</button>\
							</div>\
						</div>\
						<div class="modal-footer">\
							<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>\
						</div>\
					</div>\
				</div>\
			</div>\
	';
}

Rochester.getExitModalHtml = function() {
	var modalHtml = '\
	<div class="modal fade" id="exitModal" tabindex="-1" role="dialog" aria-labelledby="exitModalLabel" aria-hidden="true">\
		<div class="modal-dialog" role="document">\
			<div class="modal-content">\
				<div class="modal-header">\
					<h5 class="modal-title" id="exitModalLabel">Exit Survey?</h5>\
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">\
						<span aria-hidden="true">&times;</span>\
					</button>\
				</div>\
				<div class="modal-body">';
	
	var exitModalVideo = Rochester.values['exitModalVideo'];
	var video_id = Rochester.getVidIdFromUrl(exitModalVideo);
	if (video_id) {
		var url = 'https://www.youtube.com/embed/' + video_id;
		modalHtml += '\
					<div id="exit-survey-video">\
						<iframe id="exitVideoIframe" width="800" height="560" src="' + url + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\
					</div>';
	}
	var exitModalText = Rochester.values['exitModalText'];
	if (exitModalText) {
		modalHtml += '\
					<p>' + exitModalText + '</p>';
	} else {
		modalHtml += '\
					<p>Click Exit to exit this survey or Cancel to continue.</p>';
	}
	
	modalHtml += '\
				</div>\
				<div class="modal-footer">\
					<button type="button" class="btn btn-danger" data-dismiss="modal" id="exitSurveyButton">Exit</button>\
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>\
				</div>\
			</div>\
		</div>\
	</div>';
	
	return modalHtml;
}

Rochester.exitClicked = function(event) {
	$("#exitModal").modal('show');
	player.pauseVideo();
	player2.seekTo(0);
	player2.playVideo();
}

// player handling functions

Rochester.answerSelected = function(e) {
	var input = $(this).find('input');
	var fieldName = $(this).closest("tr").attr('sq_id');
	var choiceRawValue = input.attr("value") || input.attr('code');
	if (Rochester.values && Rochester.values.fields && Rochester.values.fields[fieldName] && Rochester.values.fields[fieldName].choices && Rochester.values.fields[fieldName].choices[choiceRawValue]) {
		var url = Rochester.values.fields[fieldName].choices[choiceRawValue][Rochester.signerIndex];
		var video_id = Rochester.getVidIdFromUrl(url);
		
		player.loadVideoById(video_id);
		player.seekTo(0);
		// console.log("playing video associated with field answer choice", fieldName, choiceRawValue);
		player.playVideo();
	} else {
		// player.stopVideo();
		// player.seekTo(0);
	}
}

Rochester.setVideoByFieldName = function(fieldName) {
	// set video to this field's associated video
	// console.log('z');
	if (Rochester.values && Rochester.values.fields && Rochester.values.fields[fieldName] && Rochester.values.fields[fieldName].field) {
		var url = Rochester.values.fields[fieldName].field[Rochester.signerIndex];
		// console.log('a');
		if (url) {
			// console.log('b');
			var video_id = Rochester.getVidIdFromUrl(url);
			if (video_id) {
				// change video source and start from beginning
				// console.log("loading video with ID: " + video_id);
				if (!Rochester.curtain.locked) {
					// console.log("showing curtain from setVideoByFieldName");
					$("#curtain").hide();
				}
				$("#curtain h5").text("Click to play video.");
				// $("#curtain").css('height', '88%');
				// $("#survey-video iframe").removeClass('unseen');
				player.loadVideoById(video_id);
				player.seekTo(0);
				Rochester.curtain.locked = false;
				$('.fl-button').show();
				// console.log('Rochester.curtain.locked', Rochester.curtain.locked);
				return true;
			}
		}
	}
	
	Rochester.curtain.locked = true;
	// console.log("locking curtain");
	
	// load blank video
	player.loadVideoById('8tPnX7OPo0Q');
	player.pauseVideo();
	
	$('.fl-button').hide();
	$("#curtain h5").text("No video assigned for this survey question or answer.");
	$("#curtain").show();
}