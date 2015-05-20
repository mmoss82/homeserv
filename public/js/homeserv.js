// global $ //

$("document").ready( function () {

	var parseFileDir = function (id) {
		return id.slice(0,2) + '/' + id.slice(2,4) + '/' + id.slice(4,6) + '/' + id.slice(6,8)
		 + '/' + id.slice(8,10) + '/' + id.slice(10,12) + '/' + id.slice(12,14) + '/' + id.slice(14,16) + '/' 	
	}


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
			        + '<img class="img-responsive" src="' + parseFileDir(data[i].id)+data[i].id+'.jpg' + '" alt="">'
						+ '</a>'
					+ '</div>'
					$(image).appendTo($("#main-images-thumbs"))	
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