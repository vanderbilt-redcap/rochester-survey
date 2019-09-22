var form_name = "";

$(function() {
	$('body').on('change', ".custom-file-input", function() {
		// upload user image for signer portrait
		var fileName = $(this).val().split('\\').pop();
		$(this).next('.custom-file-label').addClass("selected").html(fileName);
		var group = $(this).closest('.image-upload');
		var input = group.find('input');
		var file_data = $(input).prop('files')[0];
		var form_data = new FormData();
		
		if (group.hasClass('signer-portrait')) {
			form_data.append("action", "portrait_upload");
			form_data.append("portrait_index", input.attr('id'));
		} else if (group.hasClass('logo-upload')) {
			form_data.append("action", "logo_upload");
		}
		
		form_data.append("image", file_data);
		form_data.append("form_name", $("#assoc_table").attr('data-form-name'));
		
		$.ajax({
			url: Rochester.configAjaxUrl,
			dataType: 'json',
			cache: false,
			contentType: false,
			processData: false,
			data: form_data,
			type: 'POST',
			success: function(response) {
				// console.log(response);
				group.find("img").remove();
				group.prepend(response.html);
				if (group.find("div.row button").length == 0 && !response.error) {
					group.find("div.row").append("<button type='button' class='btn btn-outline-danger'>Delete</button>");
				}
				
				if (response.error) {
					group.find("button").remove();
				}
			}
		});
	});
	
	// delete image button
	$("body").on("click", ".image-upload button", function() {
		// delete portrait for this signer index
		var group = $(this).closest('.image-upload');
		var data = {
			action: 'image_delete',
			form_name: $("#assoc_table").attr('data-form-name')
		};
		
		if (group.hasClass('signer-portrait')) {
			data.portrait = true;
			data.index = group.index() + 1;
		} else if (group.hasClass('logo-upload')) {
			data.end_of_survey = true;
		}
		
		// console.log(data);
		
		$.ajax({
			url: Rochester.configAjaxUrl,
			dataType: 'json',
			data: data,
			type: 'POST',
			success: function(response) {
				// console.log(response);
			},
			complete: function(data) {
				// console.log(data);
				group.find("img").remove();
				group.find("button").remove();
			}
		});
	});
	
	$(".form_picker_dd").on("click", "a", function(i, e) {
		form_name = $(this).attr("value");
		$.ajax({
			method: "POST",
			url: Rochester.configAjaxUrl,
			data: {
				action: "get_form_config",
				form_name: $(this).attr("value")
			},
			dataType: "html"
		}).done(function(msg) {
			$("#form_assocs").html(msg);
		});
		$("#form_picker").text($(this).text());
	})
	
	$("body").on("click", "#add_value_col", function(i, e) {
		var n = $("#assoc_table th").length - 1;
		$("#assoc_table").find("th").eq(n).after("\
				<th class='value_column'>\
					<div>\
						<span>Signer (" + (n - 1) + ") Video URLs</span>\
						<button class='btn btn-outline-secondary remove_column'>\
							Remove\
						</button>\
					</div>\
				</th>");
		$("#assoc_table").find("tr").each(function(i, e) {
			$(this).find("td").eq(n).after("<td class=\"value_column\"><input type=\"text\" class=\"form-control\" placeholder=\"URL\" aria-label=\"Associated value\" aria-describedby=\"basic-addon1\"></td>");
		});
		
		// // add another signer portrait upload div
		// var portraitIndex = $('.signer-portrait').length + 1;
		// $("#signer-portraits").append("\
		// <div class='signer-portrait'>\
			// <h6>Signer " + portraitIndex + "</h6>\
			// <div class='input-group'>\
				// <div class='custom-file'>\
					// <input type='file' class='custom-file-input' id='portrait" + portraitIndex + "' aria-describedby='upload'>\
					// <label class='custom-file-label text-truncate' for='portrait" + portraitIndex + "'>Choose image</label>\
				// </div>\
			// </div>\
		// </div>");
	});
	
	$("body").on("click", ".remove_column", function() {
		var th = $(this).parent().parent();
		var i = th.index();
		$("#assoc_table").find("th").eq(i).remove();
		$("#assoc_table tr").each(function(j, e) {
			$(e).find("td").eq(i).remove();
		});
		
		// rename value columns (e.g., value (3) might turn to value (2))
		$("#assoc_table th.value_column span").each(function(i, e) {
			$(e).text("Signer (" + (i + 1) + ") Video URLs");
		});
		
		// remove signer portrait upload div
		$(".signer-portrait:eq(" + (i-3) + ")").remove();
	});
	
	$("body").on("click", "#save_changes", function(i, e) {
		// create and build fields object, null where no values are associated
		var fields = {};
		var signerPreviews = [];
		var instructionsURLs = [];
		form_name = $("#assoc_table").attr("data-form-name");
		if (!form_name)
			return;
		$(".value-row .value_column").each(function(j, td) {
			var row = $(td).parent();
			var column = $(td).index() - 3;
			if (row.hasClass('signer-previews') && $(td).find('input').val()) {
				// we're dealing with a signer preview URL
				signerPreviews[column] = $(td).find('input').val();
			} else if (row.hasClass('instructions-urls') && $(td).find('input').val()) {
				// we're dealing with a signer preview URL
				instructionsURLs[column] = $(td).find('input').val();
			} else {
				var fieldName = row.attr("data-field-name");
				var cellValue = $(td).find('input').val();
				if (cellValue.length > 0) {
					// create field entry in fields array if necessary
					if (!fields.hasOwnProperty(fieldName)) {
						fields[fieldName] = {};
					}
					if (row.find(".type_column").text().search("Field") >= 0) {
						if (!fields[fieldName].hasOwnProperty("field")) {
							fields[fieldName].field = [];
						}
						fields[fieldName].field[column] = cellValue;
					} else {
						var rawValue = row.find(".label_column").attr("data-raw-value");
						if (fields[fieldName].hasOwnProperty("choices") == false)
							fields[fieldName].choices = {};
						if (fields[fieldName].choices.hasOwnProperty(rawValue) == false)
							fields[fieldName].choices[rawValue] = [];
						fields[fieldName].choices[rawValue][column] = cellValue;
					}
				}
			}
		});
		
		// // send to server to save on db
		var data = {
			form_name: form_name,
			instructions_urls: instructionsURLs,
			signer_urls: signerPreviews,
			fields: fields,
			exitModalText: $("#exitModalTextInput").val(),
			exitModalVideo: $("#exitVideoUrl").val(),
		};
		
		// console.log('sending data:', data);
		
		$.ajax({
			method: "POST",
			url: Rochester.saveConfigUrl,
			data: {
				action: "save_changes",
				data: JSON.stringify(data)
			},
			dataType: "json",
			success: function(request){
				simpleDialog(request.msg);
			},
			error: function(){
				simpleDialog("An error occurred while saving settings.  If you were automatically logged out of REDCap, you can save your changes by logging back in using another browser tab/window then clicking save again here.");
			}
		});
	})
	
	$("body").on("change", ".value_column", function(i, e) {
		if (!$("#applyToDuplicates").is(":checked")) {
			return false;
		}
		var entered_value = $(this).find("input").val();
		var target_label = $(this).parent().find(".label_column").text();
		var target_column_index = $(this).index()
		$(".value_column").each(function(index, element) {
			if ($(element).parent().find(".label_column").text() == target_label && $(element).index() === target_column_index) {
				$(element).find("input").val(entered_value);
			}
		});
	})
})