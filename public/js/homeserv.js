// global $ //

$("document").ready( function () {

	var parseFileDir = function (id) {
		return id.slice(0,2) + '/' + id.slice(2,4) + '/' + id.slice(4,6) + '/' + id.slice(6,8)
		 + '/' + id.slice(8,10) + '/' + id.slice(10,12) + '/' + id.slice(12,14) + '/' + id.slice(14,16) + '/' 	
	};
	$('#myModal').keyup(function(event){
		var index = $(this)[0].title,
		src;
		
		switch (event.keyCode) {
			case 37:
				// left key
				index = parseInt(index) -1
				console.log(index, $(this).attr('title'))
				$(this).attr('title',index);
				src = $('#'+index+'-img').attr('src').replace('_0','_1');
				$('.modal-body img').attr('src', src);
				break;
			case 39:
				// right key
				index = parseInt(index) +1;
				console.log(index, $(this).attr('title'))
				$(this).attr('title',index);
				src = $('#'+index+'-img').attr('src').replace('_0','_1');
				$('.modal-body img').attr('src', src);
				break;
			}
		})
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
									var hash_id = result[index]._id
									baseUrl = parseFileDir(hash_id)+hash_id;
									$(".row").append('<li id="'+index+'" class="col-lg-4 col-md-4 col-sm-4 col-xs-4"><img id="'+index+'-img" src="'+baseUrl+'_0.jpg'+'"/></li>');
				    		})
								
								$('li img').on('click',function(e){
									console.log($(this).parent().attr('id'))
	                var src = $(this).attr('src').replace('_0','_1');
	                var img = '<img src="' + src + '" class="img-responsive"/>';
									$('#myModal').attr('title', $(this).parent().attr('id'));
	                $('#myModal').modal();
	                $('#myModal').on('shown.bs.modal', function(){
	                    $('#myModal .modal-body').html(img);
	                });
	                $('#myModal').on('hidden.bs.modal', function(){
	                    $('#myModal .modal-body').html('');
	                });

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