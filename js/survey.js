  // Replace the 'videoIframe' element with an <iframe> and
  // YouTube player after the API code downloads.
var player;
var player2;
Rochester.initializePlayers = function() {
	// The following is safer than onYouTubeIframeAPIReady() since defining global methods can conflict with other modules (like the Analytics module).
	if(!window.YT || !YT.loaded){
		setTimeout(Rochester.initializePlayers, 50)
		return
	}

	var exitModalVideo = Rochester.values['exitModalVideo'];
	var videoId = Rochester.getVideoIdFromUrl(exitModalVideo);
	if(videoId){
		player2 = new YT.Player('exitVideoIframe', {
			videoId: videoId,
			events: {
				onReady: function(target) {
					Rochester.playersReady.player2 = true;
				}
			},
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
	var previewUrls = Rochester.values['signer_urls']
	for (i = 0; i < Rochester.signerCount; i++) {
		if (!previewUrls[i]) {
			// find first signer video since a preview video was not configured
			previewUrls[i] = Rochester.findFirstSignerVideo(i);
		}
	}
	for (i = 0; i < Rochester.signerCount; i++) {
		var videoId = Rochester.getVideoIdFromUrl(previewUrls[i]);
		if (videoId) {
			Rochester.signerPlayers[i] = new YT.Player('signer-preview-' + i, {
				videoId: videoId,
				playerVars: {
					modestbranding: 1,
					playsinline: 1,		// prevents fullscreen when user taps to select signer/see preview
					rel: 0,
					controls: 0,
					showinfo: 0
				},
				events: {
					onReady: function(target) {
						var iframe = $(target.target.getIframe())
						var parent =  iframe.parent()
						parent.find('.ios-click-area').css({
							width: iframe.width()+15,
							height: iframe.height()+15
						})

						var i = parent.index();
						if (!Rochester.playersReady.previews)
							Rochester.playersReady.previews = [];
						Rochester.playersReady.previews[i] = true
					}
				}
			});
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
			onReady: function(target) {
				Rochester.playersReady.player = true;
				$('body').on('shown.bs.modal', function() {player.pauseVideo()})
			},
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
						if (Rochester.playlist) {
							Rochester.advancePlaylist()
						} else {
							$("#curtain h5").text("Click to play video.");
							$("#curtain").show();
						}
					}
				} else {
					if (!Rochester.curtain.locked) {
						$("#curtain").hide();
					}
				}
				
				if (target.data == YT.PlayerState.PLAYING && Rochester.playlist && Rochester.curtain.locked)
					player.pauseVideo()
			}
		}
	});
}

$.extend(Rochester, {
	playersReady: {},
	initialZoom: Math.round(window.devicePixelRatio * 100),
	curtain: {
		locked: false
	},
	updateBackgroundColor: function(color) {
		$("body").css("background-color", color);
		$("html").css("background-color", color);
		$("#pagecontent").css("background-color", color);
		$("#pagecontent").css("margin-top", "0px");

		Rochester.log('background color changed', {
			color: color
		});
	},
	updateTextColor: function(color) {
		$("#container").css("color", color);
		$("#container").css("border-color", color);
		$(".fl-button").contents().addBack(".fl-button").css("color", color);
		$(".fl-button").contents().addBack(".fl-button").css("border-color", color);
		$("#pagecontent").css("margin-top", "0px");

		Rochester.log('text color changed', {
			color: color
		});
	}
});

// load dashboard content
$(function() {
	$('body').css('display', 'block');
	Rochester.init();
});

// utility and initialization

Rochester.init = function() {
	if($('button[name=submit-btn-saverecord]:contains("Next Page")').length === 1){
		simpleDialog("Multiple pages are not currently supported by the <b>Rochester Survey</b> module. Please edit this survey's settings and change <b>Question Display Format</b> to <b>All on one page</b>.")
		return
	}

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
			<div id="stickyVideoPlaceholder"></div>\
			<div class="video-container" id="survey-video">\
				<div id="curtain">\
					<h5>No video associated with this question or answer</h5>\
				</div>\
				<div id="ytplayer"></div>\
			</div>');
	
	// add exit survey iframe video too
	$("body").append(Rochester.getExitModalHtml());
	
	// add survey option buttons
	$("#survey-video").after('\
			<div id="survey-options">\
				<button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#optionsModal">\
					Options <i class="fas fa-cog"></i>\
				</button>\
				<button type="button" class="btn btn-secondary video">\
					Hide Video <i class="fas fa-video-slash"></i>\
				</button>\
				<button type="button" class="btn btn-danger">\
					Exit Survey <i class="far fa-times-circle"></i>\
				</button>\
			</div>')
	
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
			["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
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
		var defaultTextColor = 'black'
		
		$("#spectrum_bg_color").spectrum("set", defaultBgColor)
		$("#spectrum_text_color").spectrum("set", defaultTextColor)

		Rochester.updateBackgroundColor(defaultBgColor)
		Rochester.updateTextColor(defaultTextColor)
	});
	
	// hide most of #pagecontent (except surveytitlelogo and instructions)
	$("#pagecontent form").addClass("unseen");
	$(".sldrparent *").removeClass('unseen');
	
	Rochester.hideBackButtonIfAppropriate();
	
	// ---------------- register events
	// stickify the survey video in portrait
	$(window).on('resize orientationchange scroll', Rochester.setVideoAnchor);
	$('body').on('focus', 'textarea, input[type="text"]', Rochester.setVideoAnchor);
	
	// nav, watch question video, exit survey
	$("body").on('click', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('click', "#survey-navigation button:last-child", Rochester.nextClicked);
	$("body").on('click', "#survey-options button.video", Rochester.videoButtonClicked);
	$("body").on('click', "#survey-options button:last-child", Rochester.exitClicked);
	
	/* the following event triggers when an answer is selected from these field types:
			Multiple Choice - Radio Buttons (Single Answer)
			Checkboxes (Multiple Answers)
			Yes - No
			True - False
	*/
	$("body").on("click", "#questiontable tr [class^=choice]", function() {
		delete Rochester.playlist
		var fieldName = $(this).closest("tr").attr("sq_id");
		var rawAnswerValue = $(this).find("input").attr("value") || $(this).find("input").attr("code");
		Rochester.setVideo(fieldName, rawAnswerValue);
	});
	
	$('body').on('click', '.video-container', function() {
		if ($(this).find('.signer-preview').length > 0)
			Rochester.signerPreviewClicked(this)
	});
	
	// triggers on all modals that get closed
	$("body").on('hidden.bs.modal', Rochester.onModalClose);
	
	$('div#curtain').click(function(){
		if (!Rochester.curtain.locked) {
			$("#curtain").hide();
			if (Rochester.playlist) {
				player.loadVideoById(Rochester.playlist.videoIds[Rochester.playlist.videoIndex])
			} else {
				player.playVideo();
			}
		}
	});
	
	// allow users to load question video after selecting answers
	$("body").on("click", ".fl-button", function(target) {
		// set video to this field's associated video
		delete Rochester.playlist
		var fieldName = $(Rochester.surveyTarget).attr('sq_id');
		Rochester.setVideo(fieldName);
	});
	
	// yt player controls listen
	// $("body").on('change', '#ytCaptions, #ytVolume', function() {Rochester.useYtControls = true});
	var updateExampleTextFontSize = function(){
		var fontSize = $($('.labelrc')[0]).css('font-size');
		$('#optionsModal .font-size-example').css('font-size', fontSize);
		Rochester.log('font size changed', {
			size: fontSize
		});
	}
	
	// font resize buttons available in Survey Options modal
	$("#changeFont").hide();
	var optionsModal = $('#optionsModal')
	$("body").on("click", ".shrinkFont", function() {
		$(".decreaseFont").trigger("click");
		updateExampleTextFontSize();
	});
	$("body").on("click", ".growFont", function() {
		$(".increaseFont").trigger("click");
		updateExampleTextFontSize();
	});
	
	// add on-screen keyboards to textareas
	// $("textarea").each(function(i, e) {
		// $(e).keyboard({});
	// });
	
	$("body").on("hide.bs.modal", function(event) {
		if (!Rochester.playersAreReady())
			event.preventDefault();
	});
	
	// Open the signer model regardless for now.
	// We may want to change this if we add support preserving settings when navigating between surveys.
	// if(Rochester.isInitialLoad){
		// prompt user to select a signer
		Rochester.openSignerModal();
	// }

	// Prevent automatic scrolling on refresh (in browsers that support it).
	history.scrollRestoration = "manual";

	Rochester.initializePlayers();
}

Rochester.logSettingsJSON = function() {
	var data = []
	$('#assoc_table tr').each(function(i, row){
		$(row).find('.value_column input').each(function(j, input){
			if(!data[i]){
				data[i] = [];
			}

			data[i][j] = $(input).val();
		});
	});

	console.log(JSON.stringify(data))
}

Rochester.setSettingsFromJSON = function(data) {
	data = JSON.parse(data)
	$('#assoc_table tr').each(function(i, row){
		$(row).find('.value_column input').each(function(j, input){
			$(input).val(data[i][j]);
		});
	});
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
	
	// count instructions_urls and signer preview urls too
	signerCount = Math.max(signerCount, Rochester.values.instructions_urls.length, Rochester.values.signer_urls.length)
	Rochester.signerCount = signerCount;
}

Rochester.getVideoIdFromUrl = function(url) {
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

Rochester.clickNextOrSubmitButton = function() {
	$('button[name=submit-btn-saverecord]').click()
}

Rochester.videoButtonClicked = function() {
	var html = $(this).html();
	var logMessage;
	if (html.search("Hide") != -1) {
		html = html.replace("Hide", "Show")
		html = html.replace("video-slash", "video")
		$(this).html(html);
		player.pauseVideo();
		$("#survey-video").css('display', 'none');
		logMessage = 'hidden';
	} else {
		html = html.replace("Show", "Hide")
		html = html.replace("video", "video-slash")
		$(this).html(html);
		player.playVideo();
		$("#survey-video").css('display', 'flex');
		logMessage = 'shown';
	}
	
	Rochester.setVideoAnchor()
	Rochester.log('video ' + logMessage);
}

Rochester.findFirstSignerVideo = function(signerIndex) {
	if (Rochester.values.instructions_urls[signerIndex])
		return Rochester.values.instructions_urls[signerIndex]
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

Rochester.playersAreReady = function() {
	var url = Rochester.values['exitModalVideo'];
	if (url) {
		var videoId = Rochester.getVideoIdFromUrl(url);
	}
	if (!Rochester.playersReady)
		return false;
	if (!Rochester.playersReady.previews)
		return false;
	if (!Rochester.playersReady.player)
		return false;
	if (videoId && !Rochester.playersReady.player2)
		return false;
	for (i = 0; i < Rochester.signerCount; i++) {
		if (!Rochester.playersReady.previews[i])
			return false;
	}
	return true;
}

// survey navigation

Rochester.backClicked = function() {
	var foundNewTarget = false;
	delete Rochester.playlist
	// try to find a suitable previous questiontable tbody tr to display
	$(Rochester.surveyTarget).prevAll().each(function(i, e) {
		if (Rochester.isRealField(e)) {
			// hide/show field
			$(Rochester.surveyTarget).addClass("unseen");
			Rochester.surveyTarget = e;
			$(e).removeClass("unseen");
			
			// set video to this field's associated video
			var fieldName = $(e).attr('sq_id');
			Rochester.setPlaylist(fieldName);
			window.scrollTo(0, 0);
			Rochester.setVideoAnchor();
			
			Rochester.log('field changed', {
				fieldName: fieldName,
				direction: 'backward'
			})
			
			foundNewTarget = true;
			return false;
		}
	});
	
	// if we can't find one, unseen the form and surveytarget, show survey instructions, hide back button
	if (!foundNewTarget) {
		var surveyTitleLogo = $("#surveytitlelogo")[0];
		if(Rochester.surveyTarget === surveyTitleLogo){
			if (Rochester.hasPreviousPage()) {
				Rochester.getPreviousPageButton().click();
			}
		}
		else{
			// hide
			$(Rochester.surveyTarget).addClass("unseen");
			$("#pagecontent form").addClass("unseen");
			$(".sldrparent *").removeClass('unseen');
			
			Rochester.hideBackButtonIfAppropriate();
			
			// show
			Rochester.surveyTarget = surveyTitleLogo;
			$("#surveytitlelogo").removeClass("unseen");
			$("#surveyinstructions").removeClass("unseen");
			
			// no field name supplied, will default to showing instructions video (if possible)
			Rochester.setVideo();
			window.scrollTo(0, 0);
			Rochester.setVideoAnchor();

			Rochester.log('field changed back to survey instructions');
		}
	}
}

Rochester.getPreviousPageButton = function() {
	return $('button[name=submit-btn-saveprevpage]');
}

Rochester.hasPreviousPage = function() {
	return Rochester.getPreviousPageButton().length === 1;
}

Rochester.hideBackButtonIfAppropriate = function() {
	if (!Rochester.hasPreviousPage()) {
		$("#survey-navigation button:eq(0)").addClass("unseen");
	}
}

Rochester.hasCurrentFieldBeenAnswered = function() {
	var answered = false;
	$(Rochester.surveyTarget).find('input, select, textarea').each(function(index, element){
		element = $(element);
		var type = element.attr('type');
		if($.inArray(type, ['radio', 'checkbox']) !== -1){
			if(!element.is(':checked')){
				return;
			}
		}
		else if(!element.val()){
			return
		}
		
		answered = true;
	})

	return answered;
}

Rochester.nextClicked = function() {
	if(
		$(Rochester.surveyTarget).find('.requiredlabel').length === 1
		&&
		!Rochester.hasCurrentFieldBeenAnswered()
	){
		simpleDialog('You must answer the current question before continuing.')
		return
	}
	
	delete Rochester.playlist
	var setSurveyToField = function(field) {
		// hide/show field elements
		$(Rochester.surveyTarget).addClass("unseen");
		Rochester.surveyTarget = field;
		$(field).removeClass("unseen");
		
		// set video to this field's associated video
		var fieldName = $(field).attr('sq_id');
		Rochester.setPlaylist(fieldName);
		
		Rochester.log('field changed', {
			fieldName: fieldName,
			direction: 'forward'
		})
		window.scrollTo(0, 0);
		Rochester.setVideoAnchor();
	}

	var elementsToCheck
	if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
		// handle case where we're not showing survey contents yet, just survey instructions (e.g., after initialization)
		$("#surveytitlelogo").addClass("unseen");
		$("#surveyinstructions").addClass("unseen");
		$("#pagecontent form").removeClass("unseen");
		$("#survey-navigation button:eq(0)").removeClass("unseen");
		
		$("#questiontable tbody").children().addClass("unseen");
		$(".sldrparent *").removeClass('unseen');

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

// modals

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
						<div class="ios-click-area"></div>\
							<div class="signer-preview" id="signer-preview-' + i + '" data-signer-index="' + i + '"></div>\
						</div>';
	}
	
	// add select button
	html += "\
						<button type='button' style='display: none' class='btn btn-primary signer-select' data-dismiss='modal'>Select this signer</button>";
	
	html += '\
					</div>\
				</div>\
			</div>\
		</div>\
	</div>';
	
	$("body").prepend(html);
	$("#signerModal").modal('show');
}

Rochester.getOptionsModalHtml = function() {
	var html = '\
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
								<button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#signerModal" onclick="$(\'#optionsModal\').modal(\'hide\')">\
									Choose Signer <i class="fas fa-user-friends"></i>\
								</button>\
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
								<div class="col-12 text-center">\
									<button type="button" class="btn btn-outline-primary shrinkFont">Smaller</button>\
									<button type="button" class="btn btn-outline-primary growFont">Larger</button>\
								</div>\
								<div class="col-12 text-center font-size-example" style="margin-top: 12px">\
									<b>Example Text</b>\
								</div>\
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

Rochester.signerPreviewClicked = function(container) {
	// stop all other signer preview videos
	var iframeId = $(container).find('iframe.signer-preview').attr('id');
	if (iframeId)
		var thisPlayer = YT.get(iframeId)
	if (!thisPlayer)
		return false
	
	// play this video, pause others
	function handleAllPlayers(playerInstance) {
		Rochester.lastPlayerInstance = playerInstance
		var state = playerInstance.getPlayerState()
		if (thisPlayer === playerInstance) {
			playerInstance.playVideo();
			playerInstance.seekTo(0)
		} else if (state == 1 || state == 3) {	// if video playing or buffering
			playerInstance.pauseVideo();
		}
	}
	Rochester.signerPlayers.forEach(handleAllPlayers)
	
	$(".signer-previews div").removeClass('blueHighlight');
	
	// highlight player's parent div
	$(container).addClass('blueHighlight');
	
	// enable and move Select button
	var button = $(container).parent().find('button');
	button.show();
	$(button.detach()).insertAfter($(container));	
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

Rochester.onModalClose = function() {
	// pause preview videos
	Rochester.signerPlayers.forEach(function(player) {
		player.pauseVideo();
	});
	
	// determine signer index and set survey video (if necessary)
	var oldSignerIndex = Rochester.signerIndex
	var newSignerIndex = $(".blueHighlight iframe").attr('data-signer-index');
	
	if (typeof newSignerIndex === 'undefined' && typeof oldSignerIndex === 'undefined') {
		// this only happens when they close the initial pick a signer modal
		newSignerIndex = 0;
		Rochester.log('defaulting to first signer');
	}
	
	if (typeof newSignerIndex !== 'undefined' && oldSignerIndex != newSignerIndex) {
		Rochester.signerIndex = newSignerIndex;
		var fieldName;
		if (Rochester.surveyTarget != $("#surveytitlelogo")[0]) {
			fieldName = $(Rochester.surveyTarget).attr('sq_id');
			Rochester.setPlaylist(fieldName);
		} else {
			// load instructions video
			Rochester.setVideo()
		}

		Rochester.setVideoAnchor();
		
		Rochester.log('signer selected', {
			signerIndex: Rochester.signerIndex
		})
	} else {
		player.playVideo();
	}
	
	// clean up
	$(".signer-previews div").removeClass('blueHighlight');
	$(".signer-select").hide();
}

Rochester.resetExitVideo = function() {
	if(player2){
		player2.pauseVideo();
		player2.seekTo(0);
	}
}

Rochester.exitClicked = function(event) {
	$("#exitModal").modal('show');
	player.pauseVideo();

	if(player2){
		player2.playVideo();
	}

	Rochester.log('exit dialog displayed');
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

// survey video player

Rochester.advancePlaylist = function() {
	var ids = Rochester.playlist.videoIds
	
	Rochester.playlist.videoIndex++
	var index = Rochester.playlist.videoIndex
	
	if (index > ids.length - 1) {
		Rochester.playlist.videoIndex = 0
		$("#curtain h5").text("Click to play video.")
		Rochester.curtain.locked = false
	} else {
		$("#curtain h5").text("Loading next video.")
		Rochester.curtain.locked = true
		player.loadVideoById(ids[index])
		setTimeout(function() {
			Rochester.curtain.locked = false
			player.playVideo()
			player.seekTo(0)
			$("#curtain").hide()
		}, 1000)
	}
	$("#curtain").show();
}

Rochester.setPlaylist = function(fieldName) {
	/* this function should only be called when the user changes fields via the previous and next buttons */
	/* NOT when clicking "watch question video" or answer video buttons */
	var playlist = []
	
	var url;
	if (Rochester.values.fields[fieldName])
		url = Rochester.values.fields[fieldName].field[Rochester.signerIndex];
	
	var videoId
	if (url)
		videoId = Rochester.getVideoIdFromUrl(url);
	
	if (!videoId) {
		Rochester.curtain.locked = true;
		$("#curtain h5").text("There is no video for this part of the survey.");
		$("#curtain").show();
		return
	}
	
	Rochester.curtain.locked = false;
	$("#curtain h5").text("Click to play video.");
	$("#curtain").hide();
	
	playlist.push(videoId)
	
	// add answer videos to playlist if applicable
	for (var choice in Rochester.values.fields[fieldName].choices) {
		videoId = Rochester.getVideoIdFromUrl(Rochester.values.fields[fieldName].choices[choice][Rochester.signerIndex]);
		if (videoId)
			playlist.push(videoId)
	}
	
	Rochester.playlist = {
		videoIds: playlist,
		videoIndex: 0
	}
	
	player.loadVideoById(Rochester.playlist.videoIds[0])
	player.seekTo(0)
}

Rochester.setVideo = function(fieldName, rawAnswerValue) {
	// get videoId from stored url depending if we're setting based on answer choice, field name (question), or survey instructions (which is not a field)
	var url;
	if (fieldName && rawAnswerValue) {
		if (Rochester.values.fields[fieldName] && Rochester.values.fields[fieldName].choices[rawAnswerValue])
			url = Rochester.values.fields[fieldName].choices[rawAnswerValue][Rochester.signerIndex];
	} else if (fieldName) {
		if (Rochester.values.fields[fieldName])
		url = Rochester.values.fields[fieldName].field[Rochester.signerIndex];
	} else {
		if (Rochester.values.instructions_urls[Rochester.signerIndex])
			url = Rochester.values.instructions_urls[Rochester.signerIndex];
	}
	
	// get video ID
	var videoId;
	if (url)
		videoId = Rochester.getVideoIdFromUrl(url);
	
	// set video and/or curtain
	if (!videoId) {
		Rochester.curtain.locked = true;
		$("#curtain h5").text("There is no video for this part of the survey.");
		$("#curtain").show();
		player.loadVideoById('8tPnX7OPo0Q'); // blank video
	} else {
		Rochester.curtain.locked = false;
		$("#curtain h5").text("Click to play video.");
		$("#curtain").hide();
		player.loadVideoById(videoId);
		player.seekTo(0)
	}
}

Rochester.setVideoAnchor = function() {
	var video = $("#survey-video");
	var w = $(window).width();
	var h = $(window).height();
	var y = window.scrollY;
	
	var newZoom = Math.round(window.devicePixelRatio * 100)
	
	var textFocus = false
	if ($(document.activeElement).is('textarea') || ($(document.activeElement).is('input') && $(document.activeElement).attr('type') == 'text'))
		textFocus = true
	
	if (w > h) {
		// linearly interpolate new padding-bottom value to ensure dynamic video height
		var minHeight = 320
		var maxHeight = 1200
		var diffHeight = maxHeight - minHeight
		var minPadBottom = 130
		var maxPadBottom = 450
		var diffPadBottom = maxPadBottom - minPadBottom
		var paddingBottom = Math.round(Math.min(Math.max(minPadBottom + (h-minHeight)*(diffPadBottom/diffHeight), minPadBottom), maxPadBottom))
		video.css('padding-bottom', paddingBottom + 'px')
	} else {
		if (h * 0.5625 > 450) {
			video.css('padding-bottom', '450px')
		} else {
			video.css('padding-bottom', '56.25%')
		}
	}
	
	if (h > w && !textFocus && (Rochester.initialZoom == newZoom) && !$('#curtain').is(':visible')) {
		video.addClass('anchored');
		
		// detect video actual height
		var videoHeight = $("#survey-video iframe").height();
		$("#stickyVideoPlaceholder").css('height', videoHeight);
		
		if (w > 800) {
			var offset = (w - 800)/2;
			video.css('left', offset + 'px');
			video.css('right', offset + 'px');
		} else {
			video.css('left', '0px');
			video.css('right', '0px');
		}
	} else {
		video.removeClass('anchored');
		$("#stickyVideoPlaceholder").css('height', "0px");
		
		video.css('left', '0px');
		video.css('right', '0px');
	}
}

Rochester.log = function(message, parameters) {
	Rochester.module.log(message, parameters)
}

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.id = 'survey-video-script';
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);