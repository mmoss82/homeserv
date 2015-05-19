// global $ //

$("document").ready( function () {

	function loadImages ( ) {
		$.ajax({
		  method: "GET",
		  url: "/images",
			success: function (data) {
				console.log('success', data);
				for (var i = 0; i < data.length; i ++ ) {
				 var image = String ()
					+ '<div class="col-lg-3 col-md-4 col-xs-6 thumb">'
			    	+ '<a class="thumbnail" href="#">'
			        + '<img class="img-responsive" src="' + data[i] + '" alt="">'
						+ '</a>'
					+ '</div>'
					image.appendTo($("#main-images-thumbs"))	
					}
				},
			error: function ( data ) {
				console.log('error', data)
				}
			} 
		)
	}
	
	loadImages();
	
})