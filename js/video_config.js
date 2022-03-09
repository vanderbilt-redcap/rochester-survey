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
		
		form_data.append("action", "logo_upload");
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
			form_name: $("#assoc_table").attr('data-form-name'),
			end_of_survey: true
		};
		
		group.find("img").remove()
		group.find("button").remove()
		group.find("input").val('')
		group.find("label").html('Choose image')
		
		$.ajax({
			url: Rochester.configAjaxUrl,
			dataType: 'json',
			data: data,
			type: 'POST'
		});
	});
	
	$(".form_picker_dd").on("click", "a.dropdown-item", function(i, e) {
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
	
	
	
	
	
	// video url export settings
	$("body").on("click", "button#export_settings", function(i, e) {
		var form_name = $("#assoc_table").attr('data-form-name');
		var ajax_url_full = Rochester.configAjaxUrl + "&action=export_settings&form_name=" + encodeURIComponent(form_name);
		window.last_ajax_url_full = ajax_url_full;
		window.location.href = ajax_url_full;
	});
	
	// video url import settings
	$("body").on("click", "button#import_settings", function(i, e) {
		// create simple dialog modal
		simpleDialog("<label for='import_file_select'><p>Upload settings file (.zip)</p></label><br><input id='import_file_select' type='file' accept='application/zip'><br><br><span id='importing_in_process'>Importing in process...</span>");
		$("#importing_in_process").hide();
		// add import button
		var buttonset = $(".simpleDialog:visible").parent().find("div.ui-dialog-buttonset");
		buttonset.prepend("<button class='ui-button ui-corner-all ui-widget import_settings_from_file'>Import</button>");
	});
	
	$("body").on("click", "button.import_settings_from_file", function(e) {
		var file_data = $('#import_file_select').prop('files')[0];
		var form_data = new FormData();
		form_data.set('import_file', file_data, 'import_file.zip');
		form_data.set('action', "import_settings");
		form_data.set('form_name', $("#assoc_table").attr('data-form-name'));
		$("#importing_in_process").show();
		$.ajax({
			type: 'POST',
			url: Rochester.configAjaxUrl,
			// dataType: 'json',
			// cache: false,
			contentType: false,
			processData: false,
			data: form_data,
			complete: function(response){
				$.ajax({
					method: "POST",
					url: Rochester.configAjaxUrl,
					data: {
						action: "get_form_config",
						form_name: $("#assoc_table").attr("data-form-name")
					},
					dataType: "html"
				}).done(function(msg) {
					$("#form_assocs").html(msg);
					var close_btn = $(".simpleDialog").parent().find("button:contains('Close')").first();
					if (close_btn) {
						close_btn.click();
					}
				});
				$("#form_picker").text($(this).text());
			}
		});
	});
	
	
	
	
	
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
		
		// send to server to save on db
		var data = {
			form_name: form_name,
			instructions_urls: instructionsURLs,
			signer_urls: signerPreviews,
			fields: fields,
			exitModalText: $("#exitModalTextInput").val(),
			exitModalVideo: $("#exitVideoUrl").val()
		};
		
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