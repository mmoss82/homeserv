// global $ //
var socket = io();
var imageMax=0;
$("document").ready( function () {

//	socket.emit('initialLoad'); // request mongo to start adding to images list;

	var parseFileDir = function (id) {
		return id.slice(0,2) + '/' + id.slice(2,4) + '/' + id.slice(4,6) + '/' + id.slice(6,8)
		 + '/' + id.slice(8,10) + '/' + id.slice(10,12) + '/' + id.slice(12,14) + '/' + id.slice(14,16) + '/' 	
	};
	$('#myModal').keyup(function(event){
		var index = parseInt($(this)[0].title),
		src;
		
		switch (event.keyCode) {
			case 37:
				// left key
				if (index > -1) {
					index = index -1					
				
					console.log(index, $(this).attr('title'))
					$(this).attr('title',index);
					src = $('#'+index.toString()+'-img').attr('src').replace('_0','_1');
					$('.modal-body img').attr('src', src);
					break;
				}
			case 39:
				// right key
				index = index +1;
				console.log(index, $(this).attr('title'))
				$(this).attr('title',index);
				src = $('#'+index.toString()+'-img').attr('src').replace('_0','_1');
				$('.modal-body img').attr('src', src);
				break;
			}
		})
		
	$(document).keyup(function(e){
		if (event.keyCode === 32){
			console.log(imageMax);
 			socket.emit('loadMore', imageMax)
		}
	})
		
	function addImages ( result ) {
			var carouselLinks = [],
			linksContainer = $('#links'),
			baseUrl;
			imageMax = imageMax + result.data.length;
			// Add the demo images as links with thumbnails to the page:
			$.each(result.data, function (index, photo) {
				console.log(index, photo);
				// parseFileDir(data[i].id)+data[i].id+'.jpg'
				var hash_id = photo._id
				baseUrl = parseFileDir(hash_id)+hash_id;
				i = (parseInt(imageMax)+parseInt(index)).toString();
				$(".image-row").append('<li id="'+i+'" class="col-lg-4 col-md-4 col-sm-4 col-xs-4"><img id="'+index+'-img" src="'+baseUrl+'_0.jpg'+'"/></li>');
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
		})
	}
	$('#moreButton').on('click', function (e) {
		e.preventDefault();
		console.log('socketing');
	  var date = $('#datetimepicker2').val();
		$(".image-row").empty();
		socket.emit('initialLoad', 
			{
				imageMax : 0,
				date : date
			}
		);
	})
	socket.on('moreImages', function (results) {
		addImages(results);		
	})
	
	
})