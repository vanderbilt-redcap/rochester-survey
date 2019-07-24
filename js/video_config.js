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
			$("#form_assocs").innerHtml(msg);
		});
	})
})