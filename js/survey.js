// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');
$('head').append('<link rel="stylesheet" type="text/css" href="SPECTRUM_CSS">');
$('head').append('<link rel="stylesheet" type="text/css" href="KEYBOARD_CSS">');

$('head').append('<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">');
$('head').append('<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.0/themes/ui-lightness/jquery-ui.css" rel="stylesheet">');

// load dashboard content
$(function() {	
	Rochester.init();
	Rochester.ajaxURL = "SURVEY_AJAX_URL";
});

var player;
var player2;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('videoIframe', {
		// events: {
			// 'onApiChange': function(target, data) {
				// console.log(player.getOptions());
			// }
		// }
	});
	player2 = new YT.Player('exitVideoIframe', {
		events: {
			'onReady': function(event) {
				event.target.seekTo(0);
				
				event.target.playVideo();
			}
		}
	});
}
	  
var Rochester = {};

Rochester.init = function() {
	Rochester.signerIndex = 0;
	Rochester.surveyTarget = $("#surveytitlelogo")[0];
	var first_vid_url = "";
	if (associatedValues != false) {
		Rochester.values = associatedValues;
		Rochester.countSigners()
		let url = Rochester.values.record_id.field[0];
		let video_id = url.split('v=')[1];
		let ampersandPosition = video_id.indexOf('&');
		first_vid_url = `https://www.youtube.com/embed/` + video_id;
		if(ampersandPosition != -1) {
			first_vid_url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition);
		}
	}
	
	// add video button to field labels
	$(".fl").each(function(i, e) {
		$(e).after(`<button type='button' class='btn btn-outline-primary fl-button'>
				<span>Watch Question Video<span><i class='fas fa-video'></i>
			</button>`);
	});
	
	// add video iframe element, survey control div/button, hide most of the #pagecontent and questiontable children children
	$("#pagecontainer").prepend(`
			<div id="survey-video">
				<iframe id="videoIframe" width="800" height="560" src="` + first_vid_url + "?enablejsapi=1&rel=0&start=0&modestbranding=1" + `" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen</iframe>
			</div>`);
	
	// add exit survey iframe video too
	$("body").append(Rochester.getExitModalHtml());
	
	var tag = document.createElement('script');
	tag.id = 'survey-video-script';
	tag.src = 'https://www.youtube.com/iframe_api';
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	
	$("#container").before(`
			<div id="survey-options">
				<button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#optionsModal">
					Survey Options<i class="fas fa-cog" style="margin-left: 8px"></i>
				</button>
				<button type="button" class="btn btn-secondary video">
					Hide Video<i class="fas fa-video-slash" style="margin-left: 8px"></i>
				</button>
				<button type="button" class="btn btn-danger">
					Exit Survey<i class="far fa-times-circle" style="margin-left: 8px"></i>
				</button>
			</div>
			<div class="modal fade" id="optionsModal" tabindex="-1" role="dialog" aria-labelledby="optionsModalLabel" aria-hidden="true">
				<div class="modal-dialog" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title" id="optionsModalLabel">Survey Options</h5>
							<button type="button" class="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div class="modal-body">
							<h5>Choose a Signer</h5>
							<div class="row justify-content-around">
								${Rochester.getSignerButtons()}
							</div>
							<h5>Adjust Colors</h5>
							<div class="row justify-content-around">
								<div class="col text-center">
									<h5>Background Color</h5>
									<input id="spectrum_bg_color">
								</div>
								<div class="col text-center">
									<h5>Text Color</h5>
									<input id="spectrum_text_color">
								</div>
							</div>
							<h5>Adjust Text Size</h5>
							<div class="row justify-content-around">
								<button type="button" class="btn btn-outline-primary shrinkFont">Make Text Smaller</button>
								<button type="button" class="btn btn-outline-primary growFont">Make Text Bigger</button>
							</div>
							<h5>YouTube Player Settings</h5>
							<div class="row justify-content-around align-items-center" id="ytPlayerControls">
								<div class="slidecontainer">
									<label for=""ytVolume">Volume</label>
									<input type="range" min="1" max="100" value="100" class="slider" id="ytVolume">
								</div>
								<div class="custom-control custom-switch">
									<input type="checkbox" class="custom-control-input" id="ytCaptions">
									<label class="custom-control-label" for="ytCaptions">Use Closed Captions</label>
								</div>
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
	
	// spectrum color picker creation/initialization
	$("#spectrum_bg_color").spectrum({
		color: "#FFF",
		flat: true,
		showButtons: false,
		move: function(color) {
			Rochester.bgColor = color.toHexString();
			$("body").css("background-color", color.toHexString());
			$("html").css("background-color", color.toHexString());
			$("#pagecontent").css("background-color", color.toHexString());
			$("#pagecontent").css("background", color.toHexString());
		}
	});
	$("#spectrum_text_color").spectrum({
		color: "#FFF",
		flat: true,
		showButtons: false,
		move: function(color) {
			$("#container").css("color", color.toHexString());
			$("#container").css("border", "2px solid " + color.toHexString());
			$("#pagecontent").css("margin-top", "none");
			$(".fl-button").contents().addBack(".fl-button").css("color", color.toHexString());
			$(".fl-button").contents().addBack(".fl-button").css("border-color", color.toHexString());
		}
	});
	
	// register events
	$("body").on('click', "#survey-navigation button:first-child", Rochester.backClicked);
	$("body").on('click', "#survey-navigation button:last-child", Rochester.nextClicked);
	$("body").on('click', "#survey-options button.video", Rochester.videoButtonClicked);
	$("body").on('click', "#survey-options button:last-child", Rochester.exitClicked);
	$("body").on("click", "#questiontable tr input", Rochester.answerSelected);
	$("body").on("click", ".signer-portrait", function() {
		Rochester.signerIndex = $(this).index();
		let modal = $(this).closest('.modal');
		if (modal.attr('id') == 'signerModal') {
			modal.modal('hide');
		}
		if (Rochester.surveyTarget == $("#surveytitlelogo")[0]) {
			Rochester.setVideoByFieldName("record_id");
		} else {
			let fieldName = $(Rochester.surveyTarget).attr('sq_id');
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
	});
	$("#fontSizeSlider").on("change", function() {
		let zoom = $("#fontSizeSlider").val() + "%";
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
	$("body").on("click", ".fl-button", function(target) {
		// set video to this field's associated video
		let fieldName = $(Rochester.surveyTarget).attr('sq_id');
		Rochester.setVideoByFieldName(fieldName);
	});
	
	// yt player controls listen
	$("body").on('change', '#ytCaptions, #ytVolume', function() {Rochester.useYtControls = true});
	
	// exit survey modal Exit button
	$("body").on("click", "#exitSurveyButton", function() {
		dataEntrySubmit(document.getElementById('submit-action'));
	});
	
	// hide most of #pagecontent (except surveytitlelogo and instructions)
	$("#pagecontent form").addClass("unseen");
	$("#survey-navigation button:eq(0)").addClass("unseen");
	
	// font resize buttons available in Survey Options modal
	$("#changeFont").hide();
	$("body").on("click", ".shrinkFont", function() {
		$(".decreaseFont").trigger("click");
	});
	$("body").on("click", ".growFont", function() {
		$(".increaseFont").trigger("click");
	});
	
	// add on-screen keyboards to textareas
	$("textarea").each(function(i, e) {
		$(e).keyboard({});
	});
	
	// prompt user to select a signer
	Rochester.openSignerModal();
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
			// hide/show field
			$(Rochester.surveyTarget).addClass("unseen");
			Rochester.surveyTarget = e;
			$(e).removeClass("unseen");
			
			// set video to this field's associated video
			let fieldName = $(e).attr('sq_id');
			Rochester.setVideoByFieldName(fieldName);
			
			if (Rochester.useYtControls) {
				player.setVolume($("#ytVolume").val());
				console.log('yt player volume set to: ' + $("#ytVolume").val());
				// if ($("#ytCaptions").prop("checked")) {
					// player.loadModule("captions");
					// player.setOption("captions", "track", {"languageCode": "es"});
				// } else {
					// player.unloadModule("captions");
				// }
			}
			if ($("#survey-video").css('display') == 'flex') {
				player.playVideo();
			} else {
				player.pauseVideo();
			}
			
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
	let setSurveyToField = function(field) {
		// hide/show field elements
		$(Rochester.surveyTarget).addClass("unseen");
		Rochester.surveyTarget = field;
		$(field).removeClass("unseen");
		
		// set video to this field's associated video
		let fieldName = $(field).attr('sq_id');
		let vidFound = Rochester.setVideoByFieldName(fieldName);
		
		if (Rochester.useYtControls) {
			player.setVolume($("#ytVolume").val());
			player.hideVideoInfo();
			console.log('yt player volume set to: ' + $("#ytVolume").val());
			// if ($("#ytCaptions").prop("checked")) {
				// player.loadModule("captions");
				// player.setOption("captions", "track", {"languageCode": "es"});
			// } else {
				// player.unloadModule("captions");
			// }
		}
		if ($("#survey-video").css('display') == 'flex' && vidFound) {
			player.playVideo();
		} else {
			player.pauseVideo();
		}
		
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
		let foundNewTarget = false;
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
		let foundNewTarget = false;
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
	let html = $(this).html();
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

Rochester.setVideoByFieldName = function(fieldName) {
	// set video to this field's associated video
	if (Rochester.values && Rochester.values[fieldName] && Rochester.values[fieldName].field) {
		let url = Rochester.values[fieldName].field[Rochester.signerIndex];
		if (url) {
			let video_id = url.split('v=')[1];
			let ampersandPosition = video_id.indexOf('&');
			let vid_url = `https://www.youtube.com/embed/` + video_id + "?enablejsapi=1&rel=0&start=0&modestbranding=1";;
			if(ampersandPosition != -1) {
				vid_url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition) + "?enablejsapi=1&rel=0&start=0&modestbranding=1";
			}
			
			// change video source and start from beginning
			console.log("loading video at URL: " + vid_url);
			player.loadVideoByUrl({
				mediaContentUrl: vid_url,
				startSeconds: 0
			});
			return true;
		}
	} else {
		return false;
	}
}

Rochester.answerSelected = function(e) {
	let fieldName = $(this).closest("tr").attr('sq_id');
	let choiceRawValue = $(this).attr("value");
	if (Rochester.values && Rochester.values[fieldName] && Rochester.values[fieldName].choices && Rochester.values[fieldName].choices[choiceRawValue]) {
		let url = Rochester.values[fieldName].choices[choiceRawValue][Rochester.signerIndex];
		let video_id = url.split('v=')[1];
		let ampersandPosition = video_id.indexOf('&');
		let vid_url = `https://www.youtube.com/embed/` + video_id;
		if(ampersandPosition != -1) {
			vid_url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition);
		}
		// $("#survey-video iframe").attr("src", vid_url);
		player.loadVideoByUrl({
			mediaContentUrl: vid_url,
			startSeconds: 0
		});
		player.seekTo(0);
		// player.playVideo();
	} else {
		player.stopVideo();
		player.seekTo(0);
	}
}

Rochester.countSigners = function() {
	if (!Rochester.values) {
		Rochester.signerCount = 0;
		return false;
	}
	
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
	Rochester.signerCount = signerCount;
}

Rochester.getSignerButtons = function() {
	// make and return html buttons
	let html = "";
	for (i = 1; i <= Rochester.signerCount; i++) {
		let img = signer_portraits[i] ? signer_portraits[i] : "<i class=\"fas fa-portrait\"></i>";
		html += `
					<div class='signer-portrait close-on-select'>
						` + img + `
						<button type="button" class="btn btn-primary">Signer ` + i + `</button>
					</div>`;
	}
	return html;
}

Rochester.openSignerModal = function() {
	let html = `
	<div class="modal fade" id="signerModal" tabindex="-1" role="dialog" aria-labelledby="signerModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="signerModalLabel">Choose a Signer</h5>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="signer-portraits">`;
	
	// for (i = 1; i <= Rochester.signerCount; i++) {
		// html += `
					// <div class='signer-portrait close-on-select'>
						// ` + signer_portraits[i] + `
						// <button type="button" class="btn btn-primary">Signer ` + i + `</button>
					// </div>`;
	// }
	
	html += Rochester.getSignerButtons();
	
	html += `
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
				</div>
			</div>
		</div>
	</div>`;
	
	$("body").prepend(html);
	$("#signerModal").modal('show');
}

Rochester.getExitModalHtml = function() {
	let modalHtml = `
	<div class="modal fade" id="exitModal" tabindex="-1" role="dialog" aria-labelledby="exitModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="exitModalLabel">Exit Survey?</h5>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">`;
				
	if (exitModalVideo) {
		let video_id = exitModalVideo.split('v=')[1];
		let ampersandPosition = video_id.indexOf('&');
		let url = `https://www.youtube.com/embed/` + video_id;
		if(ampersandPosition != -1) {
			url = `https://www.youtube.com/embed/` + video_id.substring(0, ampersandPosition);
		}
		modalHtml += `
					<div id="exit-survey-video">
						<iframe id="exitVideoIframe" width="800" height="560" src="` + url + "?enablejsapi=1&rel=0&showinfo=0&ecver=2" + `" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
					</div>`;
	}
	if (exitModalText) {
		modalHtml += `
					<p>` + exitModalText + `</p>`;
	} else {
		modalHtml += `
					<p>Click OK to exit this survey or Cancel to continue.</p>`;
	}
	
	modalHtml += `
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-danger" data-dismiss="modal" id="exitSurveyButton">Exit</button>
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
				</div>
			</div>
		</div>
	</div>`;
	
	return modalHtml;
}

Rochester.exitClicked = function(event) {
	$("#exitModal").modal('show');
	player.pauseVideo();
	player2.seekTo(0);
	player2.playVideo();
}
