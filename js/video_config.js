// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');
$('head').append('<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">');

var form_name = "";

$(function() {
	$('body').on('click touchstart', ".custom-file-input", function() {
		// upload user image for signer portrait
		$(this).val('')
	});
	
	$('body').on('change', ".custom-file-input", function() {
		// upload user image for signer portrait
		let fileName = $(this).val().split('\\').pop();
		$(this).next('.custom-file-label').addClass("selected").html(fileName);
		let input = group.find('input');
		let file_data = $(input).prop('files')[0];
		let form_data = new FormData();
		
		let group = $(this).closest('.image-upload');
		if (group.hasClass('signer-portrait')) {
			form_data.append("action", "portrait_upload");
			form_data.append(input.attr('id'), file_data);
			form_data.append("portrait_upload", input.attr('id'));
			form_data.append("portrait_form_name", form_name);
		} else if (group.hasClass('logo-upload')) {
			form_data.append("action", "logo_upload");
			form_data.append("image", file_data);
			form_data.append("form_name", form_name);
		}
		
		form_data.append("action", imageType + "_upload");
		$.ajax({
			url: 'video_config_ajax.php',
			dataType: 'json',
			cache: false,
			contentType: false,
			processData: false,
			data: form_data,
			type: 'POST',
			success: function(response) {
				console.log(response);
				group.find("img").remove();
				group.prepend(response.html);
				if (group.find("div.row button").length == 0 && !response.error) {
					group.find("div.row").append("<button type='button' class='btn btn-outline-danger'>Delete</button>");
				}
				
				if (response.error) {
					group.find("button").remove();
				}
			},
			complete: function(data) {
				// console.log(data);
			}
		});
	});
	
	// delete portrait button
	$("body").on("click", ".signer-portrait button", function() {
		// delete portrait for this signer index
		let group = $(this).closest('.signer-portrait');
		let data = {
			action: 'portrait_delete',
			index: group.index() + 1,
			form_name: form_name
		};
		$.ajax({
			url: 'video_config_ajax.php',
			dataType: 'json',
			data: data,
			type: 'POST',
			success: function(response) {
				console.log(response);
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
			url: "video_config_ajax.php",
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
		let n = $("#assoc_table th").length - 1;
		$("#assoc_table").find("th").eq(n).after(`
				<th class="value_column">
					<div>
						<span>Value (${n - 1})</span>
						<button class="btn btn-outline-secondary remove_column">
							Remove
						</button>
					</div>
				</th>`);
		$("#assoc_table").find("tr").each(function(i, e) {
			$(this).find("td").eq(n).after("<td class=\"value_column\"><input type=\"text\" class=\"form-control\" placeholder=\"Value\" aria-label=\"Associated value\" aria-describedby=\"basic-addon1\"></td>");
		});
		
		// add another signer portrait upload div
		let portraitIndex = $('.signer-portrait').length + 1;
		$("#signer-portraits").append(`
		<div class="signer-portrait">
			<h6>Signer ` + portraitIndex + `</h6>
			<div class="input-group">
				<div class="custom-file">
					<input type="file" class="custom-file-input" id="portrait${portraitIndex}" aria-describedby="upload">
					<label class="custom-file-label text-truncate" for="portrait${portraitIndex}">Choose image</label>
				</div>
			</div>
		</div>`);
	});
	
	$("body").on("click", ".remove_column", function() {
		let th = $(this).parent().parent();
		let i = th.index();
		$("#assoc_table").find("th").eq(i).remove();
		$("#assoc_table tr").each(function(j, e) {
			$(e).find("td").eq(i).remove();
		});
		
		// rename value columns (e.g., value (3) might turn to value (2))
		$("#assoc_table th.value_column span").each(function(i, e) {
			$(e).text("Value (" + (i + 1) + ")");
		});
		
		// remove signer portrait upload div
		$(".signer-portrait:eq(" + (i-3) + ")").remove();
	});
	
	$("body").on("click", "#save_changes", function(i, e) {
		// create and build fields object, null where no values are associated
		let fields = {};
		let form_name = $("#assoc_table").attr("data-form-name");
		if (form_name == false)
			return;
		$(".value-row .value_column").each(function(j, td) {
			let row = $(td).parent();
			let fieldName = row.attr("data-field-name");
			let cellValue = $(td).find('input').val();
			let column = $(td).index() - 3;
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
					let rawValue = row.find(".label_column").attr("data-raw-value");
					if (fields[fieldName].hasOwnProperty("choices") == false)
						fields[fieldName].choices = {};
					if (fields[fieldName].choices.hasOwnProperty(rawValue) == false)
						fields[fieldName].choices[rawValue] = [];
					fields[fieldName].choices[rawValue][column] = cellValue;
				}
			}
		});
		
		// // send to server to save on db
		let data = {
			form_data: fields,
			form_name: form_name,
			exit_survey: {
				modalText: $("#exitModalTextInput").val(),
				modalVideo: $("#exitVideoUrl").val(),
			}
		};
		
		$.ajax({
			method: "POST",
			url: "video_config_ajax.php",
			data: {
				action: "save_changes",
				data: JSON.stringify(data)
			},
			dataType: "json"
		}).done(function(msg) {
			// console.log(JSON.parse(msg));
		});
	})
	
	$("body").on("change", ".value_column", function(i, e) {
		if (!$("#applyToDuplicates").is(":checked")) {
			return false;
		}
		let entered_value = $(this).find("input").val();
		let target_label = $(this).parent().find(".label_column").text();
		let target_column_index = $(this).index()
		// console.log($(this));
		// console.log($(".value_column"));
		$(".value_column").each(function(index, element) {
			// console.log($(element).index());
			if ($(element).parent().find(".label_column").text() == target_label && $(element).index() === target_column_index) {
				// console.log($(element));
				$(element).find("input").val(entered_value);
			}
		});
	})
})