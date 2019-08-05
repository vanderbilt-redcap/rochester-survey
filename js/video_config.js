// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');
$('head').append('<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">');

$(function() {
	$(".form_picker_dd").on("click", "a", function(i, e) {
		$.ajax({
			method: "POST",
			url: "video_config_ajax.php",
			data: {form_name: $(this).attr("value")},
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
						<span>Value (${n})</span>
						<button class="btn btn-outline-secondary remove_column">
							Remove
						</button>
					</div>
				</th>`);
		$("#assoc_table").find("tr").each(function(i, e) {
			$(this).find("td").eq(n).after("<td class=\"value_column\"><input type=\"text\" class=\"form-control\" placeholder=\"Value\" aria-label=\"Associated value\" aria-describedby=\"basic-addon1\"></td>");
		});
	});
	
	$("body").on("click", ".remove_column", function() {
		let th = $(this).parent().parent();
		let i = th.index();
		$("#assoc_table").find("th").eq(i).remove();
		$("#assoc_table tr").each(function(j, e) {
			$(e).find("td").eq(i).remove();
		});
	});
	
	$("body").on("click", "#save_changes", function(i, e) {
		// create and build fields object, null where no values are associated
		Rochester.fields = {};
		$(".value-row .value_column").each(function(j, td) {
			let row = $(td).parent();
			let fieldName = row.attr("data-field-name");
			let cellValue = $(td).find('input').val();
			let column = $(td).index() - 2;
			if (cellValue.length > 0) {
				// create field entry in fields array if necessary
				if (!Rochester.fields.hasOwnProperty(fieldName)) {
					Rochester.fields[fieldName] = {};
					Rochester.fields[fieldName].field = [];
				}
				if (row.find(".type_column").text().search("Question") >= 0) {
					if (!Rochester.fields[fieldName].hasOwnProperty("field")) {
						Rochester.fields[fieldName].field = [];
					}
					Rochester.fields[fieldName].field[column] = cellValue;
				} else {
					let rawValue = row.find(".label_column").attr("data-raw-value");
					if (Rochester.fields[fieldName].hasOwnProperty("choices") == false)
						Rochester.fields[fieldName].choices = {};
					if (Rochester.fields[fieldName].choices.hasOwnProperty(rawValue) == false)
						Rochester.fields[fieldName].choices[rawValue] = [];
					Rochester.fields[fieldName].choices[rawValue][column] = cellValue;
				}
			}
		});
		
		// // testing
		// console.log("Rochester.fields:");
		// console.log(JSON.stringify(Rochester.fields));
		
		// // send to server to save on db
		$.ajax({
			method: "POST",
			url: "video_config_ajax.php",
			data: {
				action: "save_changes",
				data: JSON.stringify(Rochester.fields)
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
	
	// if the user has saved values previously, set the interface to show those field-value associations
	if (Rochester.previousSettings) {
		//determine max set column index
		let columnsNeeded = 1;
		for (let fieldName in Rochester.previousSettings) {
			let set = Rochester.previousSettings[fieldName];
			if (set.field) {
				// columnsNeeded = 
			}
		}
	}
})