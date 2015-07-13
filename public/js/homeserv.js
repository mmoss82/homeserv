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
			success: function (result) {
				        var carouselLinks = [],
				            linksContainer = $('#links'),
				            baseUrl;
				        // Add the demo images as links with thumbnails to the page:
				        $.each(result, function (index, photo) {
									// parseFileDir(data[i].id)+data[i].id+'.jpg'
									var hash_id = result[index].id
									baseUrl = parseFileDir(hash_id)+hash_id+'.jpg';
				            $('<div>')

				                .prop('title', photo.title)
												.prop('class', 'thumb-container')
												.prop('id',hash_id)
				                .attr('data-gallery', '')
				                .appendTo(linksContainer);
				            carouselLinks.push({
				                href: baseUrl,
				                title: photo.title
				            });
										$('#'+hash_id).css('background', 'url('+baseUrl+')')
											.css('background-size', '350px auto')
											.css('background-position-x', '50%')
											.css('background-position-y', '50%')
										
				        });
				        // Initialize the Gallery as image carousel:
				        blueimp.Gallery(carouselLinks, {
				            container: '#blueimp-image-carousel',
				            carousel: true
				        });
				    },	
				
				
				
			error: function ( data ) {
				console.log('error', data)
				}
			} 
		)
	}
	
	loadImages();
	
})