// include css and bootstrap
$('head').append('<link rel="stylesheet" type="text/css" href="CSS_URL">');

$(function() {
	$(".form_picker_dd").on("click", "a", function(i, e) {
		$.ajax({
			method: "POST",
			url: "video_config_ajax.php",
			data: {form_name: $(this).attr("value")},
			dataType: "html"
		}).done(function(msg) {
			$("#form_assocs").html(msg);
			// console.log(msg);
		});
		$("#form_picker").text($(this).text());
	})
	$("body").on("change", ".value_column", function(i, e) {
		if (!$("#applyToDuplicates").is(":checked")) {
			console.log("duplicates not set");
			return false;
		}
		let entered_value = $(this).find("input").val();
		let target_label = $(this).parent().find(".label_column").text();
		$("tr.value-row").each(function(index, element) {
			if ($(element).find(".label_column").text() == target_label) {
				$(element).find("input").val(entered_value);
			}
		});
	})
})