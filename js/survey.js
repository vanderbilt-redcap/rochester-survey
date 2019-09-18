// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">');

  // Replace the 'videoIframe' element with an <iframe> and
  // YouTube player after the API code downloads.
var player;
var player2;
function onYouTubeIframeAPIReady() {
	var exitModalVideo = Rochester.values['exitModalVideo'];
	var video_id = Rochester.getVidIdFromUrl(exitModalVideo);
	if(video_id){
		player2 = new YT.Player('exitVideoIframe', {
			videoId: video_id,
			playerVars: {
				modestbranding: 1,
				playsinline: 1,
				rel: 0,
				showinfo: 0
			}
		});
	}
	else{
		$('#exit-survey-video').hide()
	}
	
	// determine video IDs for signer preview videos
	Rochester.signerPlayers = [];
	Rochester.optionsPlayers = [];
	var previewUrls = Rochester.values['signer_urls']
	for (i = 0; i < Rochester.signerCount; i++) {
		if (!previewUrls[i]) {
			// find first signer vid since a preview video was not configured
			previewUrls[i] = Rochester.findFirstSignerVid(i);
		}
	}
	for (i = 0; i < Rochester.signerCount; i++) {
		var vid_id = Rochester.getVidIdFromUrl(previewUrls[i]);
		if (vid_id) {
			var playerSettings = {
				videoId: vid_id,
				playerVars: {
					modestbranding: 1,
					rel: 0,
					showinfo: 0
				},
				events: {
					onStateChange: function(target, data){
						if (target.data == YT.PlayerState.PLAYING || target.data == YT.PlayerState.BUFFERING) {
							// stop all other signer preview videos
							Rochester.signerPlayers.forEach(function(playerInstance, i) {
								if (target.target != playerInstance) {
									playerInstance.pauseVideo();
								}
							})
							Rochester.optionsPlayers.forEach(function(playerInstance, i) {
								if (target.target != playerInstance) {
									playerInstance.pauseVideo();
								}
							})
							
							$(".signer-previews div").removeClass('blueHighlight');
							
							// highlight player's parent div
							var previewDiv = $(target.target.a.parentNode);
							previewDiv.addClass('blueHighlight');
							
							// enable and move Select button
							var button = previewDiv.parent().find('button');
							button.show();
							$(button.detach()).insertAfter(previewDiv);
						}
					}
				}
			};
			Rochester.signerPlayers[i] = new YT.Player('signer-preview-' + i, playerSettings);
			Rochester.optionsPlayers[i] = new YT.Player('options-signer-preview-' + i, playerSettings);
		}
	}
	
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
			onStateChange: function(target, data) {
				/*
					Only hiding the video on stop seems to be a good compromise.
					It hides suggestions during most use cases.
					It unfortunately also hides controls on the platforms with larger screens (an issue for very short videos).
					However, power users still have the option of pausing a video and accessing controls.
					We tried limiting the height of the curtain to hide everything except controls,
					but the controls are laid out differently on different devices
					which added some complexity that we weren't sure was worthwhile.
				*/
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
}

$.extend(Rochester, {
	curtain: {
		locked: false
	},
	updateBackgroundColor: function(color) {
		$("body").css("background-color", color);
		$("html").css("background-color", color);
		$("#pagecontent").css("background-color", color);
		$("#pagecontent").css("margin-top", "0px");
	},
	updateTextColor: function(color) {
		$("#container").css("color", color);
		$("#container").css("border", "2px solid " + color);
		$(".fl-button").contents().addBack(".fl-button").css("color", color);
		$(".fl-button").contents().addBack(".fl-button").css("border-color", color);
		$("#pagecontent").css("margin-top", "0px");
	}
});

// load dashboard content
$(function() {
	$('body').css('display', 'block');
	Rochester.init();
});

Rochester.init = function() {
	Rochester.signerIndex = 0;
	Rochester.surveyTarget = $("#surveytitlelogo")[0];
	Rochester.countSigners();
	
	// add video button to field labels
	$(".fl").each(function(i, e) {
		$(e).after('<button type="button" class="btn btn-outline-primary fl-button">\
				<span>Watch Question Video<span><i class="fas fa-video"></i>\
			</button>');
	});
	
	// add video iframe element, survey control div/button, hide most of the #pagecontent and questiontable children children
	$("#pagecontainer").prepend('\
			<div class="video-container" id="survey-video">\
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
	var sharedSpectrumOptions = {
		flat: true,
		showButtons: false,
		showPaletteOnly: true,
		palette: [
			["#000","rgb(33, 37, 41)","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
			["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
			["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
			["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
			["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
			["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
			["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
			["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
		]
	}
	$("#spectrum_bg_color").spectrum($.extend({
		color: $("body").css("background-color"),
		move: function(color) {
			Rochester.updateBackgroundColor(color.toHexString())
		}
	}, sharedSpectrumOptions));
	$("#spectrum_text_color").spectrum($.extend({
		color: $("#container").css("color"),
		move: function(color) {
			Rochester.updateTextColor(color.toHexString())
		}
	}, sharedSpectrumOptions));
	$("#optionsModal button.resetColors").click(function() {
		var defaultBgColor = 'white'
		var defaultTextColor = 'rgb(33, 37, 41)'
		
		$("#spectrum_bg_color").spectrum("set", defaultBgColor)
		$("#spectrum_text_color").spectrum("set", defaultTextColor)

		Rochester.updateBackgroundColor(defaultBgColor)
		Rochester.updateTextColor(defaultTextColor)
	});
	
	// hide most of #pagecontent (except surveytitlelogo and instructions)
	$("#pagecontent form").addClass("unseen");
	$("#survey-navigation button:eq(0)").addClass("unseen");
	
	// register events
	$("body").on('click', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('click', "#survey-navigation button:last-child", Rochester.nextClicked);
	$("body").on('click', "#survey-options button.video", Rochester.videoButtonClicked);
	$("body").on('click', "#survey-options button:last-child", Rochester.exitClicked);
	
	// $("body").on("click", "#questiontable tr input", Rochester.answerSelected);
	$("body").on("click", "#questiontable tr [class^=choice]", Rochester.answerSelected);
	
	// signer selection:
	$("body").on("click", "button.signer-select", function() {
		// find which signer preview is selected, set Rochester.signerIndex, reload video
		Rochester.signerIndex = $(".blueHighlight iframe").attr("data-signer-index");
		$("button.signer-select").hide();
	});
	$("body").on('#optionsModal hidden.bs.modal', function() { 		// (when closed by clicking outside of select a signer modal)
		// silence preview videos and hide select button
		Rochester.signerPlayers.forEach(function(playerInstance, i) {playerInstance.pauseVideo();});
		Rochester.optionsPlayers.forEach(function(playerInstance, i) {playerInstance.pauseVideo();});
		$("button.signer-select").hide();
	});
	$("body").on('#signerModal hidden.bs.modal', function() { 		// (when closed by clicking outside of select a signer modal)
		Rochester.initializeSigner();
	});
	
	$("body").on("click", "#curtain", function() {
		if (!Rochester.curtain.locked) {
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
	$("body").on("click", ".fl-button", function(target) {
		// set video to this field's associated video
		var fieldName = $(Rochester.surveyTarget).attr('sq_id');
		Rochester.setVideoByFieldName(fieldName);
	});
	
	// yt player controls listen
	// $("body").on('change', '#ytCaptions, #ytVolume', function() {Rochester.useYtControls = true});

	
	// font resize buttons available in Survey Options modal
	$("#changeFont").hide();
	var optionsModal = $('#optionsModal')
	$("body").on("click", ".shrinkFont", function() {
		$(".decreaseFont").trigger("click");
		optionsModal.modal('hide')
	});
	$("body").on("click", ".growFont", function() {
		$(".increaseFont").trigger("click");
		optionsModal.modal('hide')
	});
	
	// add on-screen keyboards to textareas
	// $("textarea").each(function(i, e) {
		// $(e).keyboard({});
	// });
	
	if(Rochester.isInitialLoad){
		// prompt user to select a signer
		Rochester.openSignerModal();
	}
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

Rochester.endSurvey = function() {
	$('body').hide() // Poor man's loading indicator

	var obname = $("#submit-action").prop("name");
	if ($('#form select[name="'+obname+'"]').hasClass('rc-autocomplete') && $('#rc-ac-input_'+obname).length) {
		$('#rc-ac-input_'+obname).trigger('blur');
	}
	// Change form action URL to force it to end the survey
	$('#form').prop('action', $('#form').prop('action')+'&__endsurvey=1' );
	// Submit the survey
	Rochester.clickNextOrSubmitButton()
}

Rochester.clickNextOrSubmitButton = function() {
	$('button[name=submit-btn-saverecord]').click()
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

	var elementsToCheck
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		// handle case where we're not showing survey contents yet, just survey instructions (e.g., after initialization)
		$("#surveytitlelogo").addClass("unseen");
		$("#surveyinstructions").addClass("unseen");
		$("#pagecontent form").removeClass("unseen");
		$("#survey-navigation button:eq(0)").removeClass("unseen");
		
		$("#questiontable tbody").children().addClass("unseen");

		elementsToCheck = $("#questiontable tbody").children()
	} else {
		elementsToCheck = $(Rochester.surveyTarget).nextAll()
	}

	var foundNewTarget = false;
	elementsToCheck.each(function(i, e) {
		if (Rochester.isRealField(e)) {
			
			setSurveyToField(e);
			
			foundNewTarget = true;
			return false;
		}
	});

	// couldn't find any more real fields
	if (!foundNewTarget) {
		Rochester.clickNextOrSubmitButton()
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

Rochester.findFirstSignerVid = function(signerIndex) {
	for (var fieldname in Rochester.values.fields) {
		var entry = Rochester.values.fields[fieldname];
		if (entry.field[signerIndex]) {
			return entry.field[signerIndex];
		}
		for (var rawValue in entry.choices) {
			if (entry.choices[rawValue][signerIndex]) {
				return entry.choices[rawValue][signerIndex];
			}
		}
	}
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
				<div class="modal-body">\
					<div class="signer-previews">';
	
	for (i = 0; i < Rochester.signerCount; i++) {
		html += '\
						<div class="video-container">\
							<div class="signer-preview" id="signer-preview-' + i + '" data-signer-index="' + i + '"></div>\
						</div>';
	}
	
	// add select button
	html += "\
						<button type='button' style='display: none' class='btn btn-primary signer-select' data-dismiss='modal'>Select</button>";
	
	html += '\
					</div>\
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

Rochester.initializeSigner = function() {	
	if(Rochester.signerIndex === undefined){
		Rochester.signerIndex = 0
	}
	
	// stop all signer preview videos
	Rochester.signerPlayers.forEach(function(player, i) {
		player.stopVideo();
	});

	var modal = $(this).closest('.modal');
	if (modal.attr('id') == 'signerModal') {
		if (!Rochester.curtain.locked) {
			$("#curtain").hide();
		}
	}
	var instructionsVideoUrl = Rochester.values['instructions_urls'][Rochester.signerIndex]
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0] && instructionsVideoUrl) {
		// Rochester.setVideoByFieldName("record_id");
		// if instructions url configured, show that video
		var vid_id = Rochester.getVidIdFromUrl(instructionsVideoUrl);
		if (vid_id) {
			if (!Rochester.curtain.locked) {
				$("#curtain").hide();
			}
			$("#curtain h5").text("Click to play video.");
			player.loadVideoById(vid_id);
			player.seekTo(0);
			Rochester.curtain.locked = false;
		}
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
	var html = '\
			<div id="survey-options">\
				<button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#optionsModal" onclick="player.pauseVideo()">\
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
							<h5 id="choose-a-signer">Choose a Signer</h5>';
	html += '\
							<div class="signer-previews">';
	
	for (i = 0; i < Rochester.signerCount; i++) {
		html += '\
								<div class="video-container">\
									<div class="signer-preview" id="options-signer-preview-' + i + '" data-signer-index="' + i + '"></div>\
								</div>';
	}
	
	// add select button
	html += "\
								<button type='button' style='display: none' class='btn btn-primary' class='signer-select' data-dismiss='modal'>Select</button>";
	
	html += '\
							</div>\
							<h5>Adjust Colors</h5>\
							<div class="row justify-content-around">\
								<div class="col-12 text-center">\
									<h5>Background Color</h5>\
									<input id="spectrum_bg_color">\
								</div>\
								<div class="col-12 text-center">\
									<h5>Text Color</h5>\
									<input id="spectrum_text_color">\
								</div>\
								<div class="col-12 text-center">\
									<button type="button" class="btn btn-outline-primary resetColors" style="margin-top: 20px; margin-bottom: 10px">Reset Colors</button>\
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
	return html;
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
				<div class="modal-body">\
					<div class="video-container" id="exit-survey-video">\
						<div id="exitVideoIframe"></div>\
					</div>';
	
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
					<button type="button" class="btn btn-danger" data-dismiss="modal" onclick="Rochester.endSurvey()">Exit</button>\
					<button type="button" class="btn btn-secondary" data-dismiss="modal" onclick="Rochester.resetExitVideo()">Cancel</button>\
				</div>\
			</div>\
		</div>\
	</div>';
	
	return modalHtml;
}

Rochester.exitClicked = function(event) {
	$("#exitModal").modal('show');
	player.pauseVideo();

	if(player2){
		player2.playVideo();
	}
}

Rochester.resetExitVideo = function() {
	if(player2){
		player2.pauseVideo();
		player2.seekTo(0);
	}
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
	if (Rochester.values && Rochester.values.fields && Rochester.values.fields[fieldName] && Rochester.values.fields[fieldName].field) {
		var url = Rochester.values.fields[fieldName].field[Rochester.signerIndex];
		if (url) {
			var video_id = Rochester.getVidIdFromUrl(url);
			if (video_id) {
				// change video source and start from beginning
				if (!Rochester.curtain.locked) {
					$("#curtain").hide();
				}
				$("#curtain h5").text("Click to play video.");
				player.loadVideoById(video_id);
				player.seekTo(0);
				Rochester.curtain.locked = false;
				$('.fl-button').show();
				return true;
			}
		}
	}
	
	Rochester.curtain.locked = true;
	
	// load blank video
	player.loadVideoById('8tPnX7OPo0Q');
	player.pauseVideo();
	
	$('.fl-button').hide();
	$("#curtain h5").text("No video assigned for this survey question or answer.");
	$("#curtain").show();
}

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.id = 'survey-video-script';
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);