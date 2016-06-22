//
// global $, lastImage, imageMax, modal_tags, mediaCheckbox, search_tag //
var socket = io(),
	imageMax=0,
	loaded = true,
	search_tag = '',
  lastImage = {
		date:'',
		tag : search_tag
	},
  mediaCheckbox = '.*',
  modal_tags = [];
	sel = false;

$("document").ready( function () {

//	socket.emit('initialLoad'); // request mongo to start adding to images list;

	var parseFileDir = function (id) {
		return id.slice(0,2) + '/' + id.slice(2,4) + '/' + id.slice(4,6) + '/' + id.slice(6,8)
		 + '/' + id.slice(8,10) + '/' + id.slice(10,12) + '/' + id.slice(12,14) + '/' + id.slice(14,16) + '/' 	
	};
	
    $('.media-checkbox').on('change', function () {
        var img = $('#vid-checkbox').is(':checked');
        var vid = $('#img-checkbox').is(':checked');
        if (img && vid ) {
            mediaCheckbox = '.*';
        } else if (vid) {
            mediaCheckbox = '.*mov|MOV';
        } else if (img) {
            mediaCheckbox = '.*(?!MOV)';
        }

    });
    
    

    $('#myModal').keyup(function(event){
		var index = parseInt($(this).attr('title')),
		src,
        img = $('#'+index.toString()+'-img');
        $('#modal_date').text(img.parent().attr('name'));
		console.log($(this).attr('title'));
        switch (event.keyCode) {
			case 37:
				// left key
				if (index > 0) {
					$('video').each(function() {$(this).pause()})
                    index = index -1					
				
					$(this).attr('title',index);
					src = img.attr('src').replace('_0','_1');
					console.log(src)
					$('#myModal .modal-body img').attr('src', src);
				}
				break;
			case 39:
				// right key
                console.log('index: ',index);
				console.log('imageMax: ',imageMax);
				if (index < imageMax -1){
                    $('video').each(function() {$(this)[0].pause()})
                    index = index +1;					
				
					console.log(index, $(this).attr('title'), imageMax)
					$(this).attr('title',index);
				    if (img.attr('class') == 'vid img-container') {
                        console.log('switching to video!');
                        src = '<video id="'+index+'-img" src="' + img.attr('title').replace('/Volumes/SATA 1500/','')  + '" width="570" controls preload="metadata"></video>' 
                    } else {
                      src = img.attr('src').replace('_0','_1');
                      src = '<img src="' + src + '" class="img-responsive">'
                    }
                    $('#myModal .modal-body').html(src);
                    console.log('date',img);
				} else {
					lastImage.date = $('li').last().attr('name');
			            socket.emit('initialLoad', lastImage)
						loaded = false;
				}
				break;
			}
		})
		

	// add more images on scroll near bottom
	$(window).scroll(function() {
		if( $(window).scrollTop() + $(window).height() > $(document).height() - 300 && loaded) {
			console.log('lastImage: ',lastImage);		
			lastImage.tag = search_tag;	
      socket.emit('initialLoad', lastImage)
			loaded = false;
	  }
	});
	
    // handle hashtag key presses to add tag to multiple images //
		// also handle global sel variable for making selections //
		$(window).keypress(function (key) {
			console.log("pressed: ",key.key);
			if (key.key == "z") {sel = true};
      if (key.key !== '#') { return; }
      // abort if img modal is open //
      if ($('#myModal').is(':visible')) { return; }

      var modal = $('#tagInputModal'),
          input = $('#modal-tag-input');
					
      modal.modal();
      //input.val('');      
      input.focus().val('');
    });
		
		$(window).keyup(function(key) {
			sel = false;
		})

    $('#modal-tag-input').keypress(function (key) {
    		// press enter handler in 'on the fly' tag multi edit //
        if (key.keyCode !== 13) { return; }
        var input = $('#modal-tag-input'),
          tags = input.val().replace('#','').split(" "),
					selected = $.find('.img-selected')
					map={};
				
				for (var i=0; i < selected.length; i++ ) {
					var id = $(selected[i]).data('hash');
					for ( var t=0; t < tags.length; t++) {
					    console.log("adding tag: ",tags[t]);
                        map = {};
						map.data = [];
						map.tag = tags[t];
						map.data.push({'_id':id})						
						uiTagUpdate(map);
					}
					// update mongo 
					singleTagSubmit({id:id,tag:tags,push:true});					
					// de-highlight //
					$(selected[i]).removeClass('img-selected');
				}
				$('#tagInputModal').modal('toggle');
    });

	function singleTagSubmit (map) {			
	      $('#image-tags').append(addTag(map.tag));
	      modal_tags.push(map.tag);
	      $('#tag-input').val('');
	      console.log('single case');
	      socket.emit('addTagSingle', map);
		};

	function uiTagUpdate (results) {
        console.log(results);
        var tagResultArray = [];
        var thumbs = $('.image-row').find('img');

        for (var i=0; i < results.data.length; i++) {
            //console.log(results.data[i]);
            tagResultArray.push(results.data[i]._id);
        }
        for (var n=0; n < thumbs.length; n++) {
            var img = $(thumbs[n]);
            if (tagResultArray.indexOf(img.data('hash')) > -1) {
                console.log('found one');
                var tagArray = img.data('tags') || [];
                var inArray = (tagArray.indexOf(results.tag) > -1);
                if (!inArray) {
                    tagArray.push(results.tag);
                    img.data('tags',tagArray);   
                }
            }
        } 
    };
	function addImages ( result ) {
			var carouselLinks = [],
			linksContainer = $('#links'),
			baseUrl;
			console.log('imageMax: ',imageMax);
			// Add the demo images as links with thumbnails to the page:
			$.each(result.data, function (index, photo) {

				// parseFileDir(data[i].id)+data[i].id+'.jpg'
				var hash_id = photo._id, s = '', r = '',
				angle = photo['Orientation'];
				baseUrl = parseFileDir(hash_id)+hash_id;
				
				var index = parseInt(index);
				var iMax = parseInt(imageMax);

				i = index + iMax;
				i = i.toString();
				var ext = photo['OriginalPath'].split('.').pop().toLowerCase();
			    var tags = photo['tags'] || '',
                    vid_icon = '';
                //var pic = '<img id="'+i+'-img" src="'+baseUrl+'_0.jpg" data-hash="'+hash_id+'" title="'+photo['OriginalPath']+'">'
                
                if (ext == 'mov') {
					console.log('we found a video!',ext);
                    var pic = '<img class="vid img-container" id="'+i+'-img" src="'+baseUrl+'_0.jpg" data-hash="'+hash_id+'" title="'+photo['OriginalPath']+'">'
                    var vid_icon = '<img class="img-vid-icon" src="img/video.png">';
                } else {
                    var pic = '<img class="img img-container" id="'+i+'-img" src="'+baseUrl+'_0.jpg" data-hash="'+hash_id+'" title="'+photo['OriginalPath']+'">'
                }

				$(".image-row").append(
					String()
					+ '<a class="a-container" name="'+photo['OriginalDateTime']+'" id="'+i+'">'
                        +  pic
                        + vid_icon
                        //    				+  '<p>CreationDate: '+photo['CreationDate']+'</p>'
//						+  '<p>Datetime: '+photo['Datetime']+'</p>'
	  			//	+	 '<p>'+photo['OriginalDateTime']+'</p>'
//						+  '<p>'+angle+'</p>'
					+ '</a>'
				);
                $('#'+i+'-img').data('tags',tags);
				lastImage.date = photo['OriginalDateTime'];
			});

			imageMax = imageMax + result.data.length;
			
            $('.vid').on('mousemove', function (e) {
                var width = $(this).width()
                var offset = $(this).offset();
                var x = e.pageX - offset.left;
                var p = Math.abs(Math.floor( ( (x*10)  / width)));
                if (p > 9) { p = 9 };
                var filename = $(this).attr('src');
                var newName = filename.slice(0,filename.length-5) + p.toString() + '.jpg';
                //console.log(newName,p);
                $(this).attr('src',newName);
            });
				
            /*$('.vid').on('click', function(e){
                var src = $(this).attr('title');
               
                var img  = '<video id="'+i+'-img" src="'+src.replace('/Volumes/SATA 1500/','')+'" width="570"  controls preload="metadata">loading video...'
                           // + '<source src="mov'+photo['OriginalPath']+'" type="video/mov">'
                        + '</video>'
            })*/

		$('.img-container').off().on('click',function(e){
          var src, img,
            $this = $(this),
            thisClass = $this.attr('class');
						console.log("ctrlKey: ",e.ctrlKey);
						console.log("altKey: ",e.altKey);
						console.log("sel",sel);
          if (sel) {
              e.preventDefault();
							// shift select multiple
							if (e.shiftKey) {
								var selected = $('.img-selected');
								var low = $(selected[0]).parent().attr("id");
								var clicked = parseInt($this.parent().attr("id"));
								var img, num, i;

								if ( low > clicked ) {
									// going backwards
									incr = -1
								} else {
									// going forwards
									incr = 1
								}
								
								i = parseInt(low);
								// this is our starting point
								n = i;
								
								for (; i != parseInt(clicked) + incr; i += incr ) {
									img = $("#"+i+"-img");
									if (img.attr("class").indexOf("img-selected") < 0 ){
										img.toggleClass('img-selected');
									}
								}								
							} else { // for single selections
								if ($this.attr("class").indexOf("img-selected") < 0 ){
									$this.addClass('img-selected');
								} else {
									$this.removeClass('img-selected');
								}
							}
              return;
          }          
          if (thisClass == 'img img-container') {           
	    				src = $this.attr('src').replace('_0','_1');
              img = '<img src="' + src + '" class="img-responsive">'
          } else if (thisClass == 'vid img-container') {
              var src = $this.attr('title');              
              var img  = '<video id="'+i+'-img" src="'+src.replace('/Volumes/SATA 1500/','')+'" width="570"  controls preload="metadata">loading video...'
              // + '<source src="mov'+photo['OriginalPath']+'" type="video/mov">'
                       + '</video>' 
          }
		  var modal = $('#myModal');
          var tags = $this.data().tags;
          console.log("setting modal_tags: ",tags); 
          modal_tags = tags || [];
          modal.attr('title', $this.attr('id'));
	
          if (modal_tags.indexOf('fav') > -1) {
              console.log('setting star to full');
              $('#add-tag-fav').find('span').toggleClass('glyphicon-star-empty').toggleClass('glyphicon-star');
          } else {
              console.log('not setting star to full');
              $('#add-tag-fav').find('span').removeClass('glyphicon-star').addClass('glyphicon-star-empty');
          } 

          $('#image-tags').empty();
          
          for (var z=0; z < tags.length; z ++) {
              console.log('tag: ',z,tags[z]);    
              var tag_html = addTag(tags[z]); 
              $('#image-tags').append(tag_html);
          }

          modal.modal();
					
					modal.on('shown.bs.modal', function(){
							$('#myModal .modal-body').html(img);
	    				$('#tag-input').focus();
          });
					modal.on('htmlden.bs.modal', function(){
							$('#myModal .modal-body').html('');
          });
          modal.on('hidden.bs.modal', function(){
              $('video').each(function() {$(this).pause()})
          });

          tagRemoveBind();
		});
	};

  var addTag = function(tag) {
      var tag_html = String()
          + '<span class="tag label label-info">' + tag
              + '<a class="remove-tag">'
                  + '<span class="glyphicon glyphicon-remove" aria-hidden="true" data-role="remove"></span>'
              + '</a>'
          + '</span>'; 
      return tag_html;
  };

  var removeTag = function(tag) {
      var tag_index = modal_tags.indexOf(tag.text());
      tag.remove();
      modal_tags.splice(tag_index,1);
      $('#tag-input').focus();
  };

  var tagRemoveBind = function () {
      $('.remove-tag').on('click', function(e) {
          var i = $('.modal').attr('title');
          var hash_id = $('#'+i).data('hash');
          var map = {};
            
          console.log("removing: ",i,hash_id, modal_tags);
          removeTag($(this).parent());

		  // TODO figure this out
          map.id = hash_id;
          map.tag = modal_tags;
          socket.emit('addTagSingle', map);
      });
  };
	
	var tagSubmit = function(e) {
      var i = $('#myModal').attr('title');
      var hash_id = $('#'+i).data('hash');
      var tag = $('#tag-input').val();
      var map = {};
      var tag_type  = $(this).attr('id');
      			
      $('#tag-input').focus();

      // handle removal of tags
			var tags = tag.split(" ");
			console.log(tags);
			for (var t = 0; t < tags.length; t++ ) {
				tag = tags[t];				
	      if (modal_tags.indexOf(tag) > 0 || tag == '' & tag_type !== 'add-tag-fav') {
	          return;
	      };      
	      if (tag == '') {
	          var fav_index = modal_tags.indexOf('fav');
	          if (fav_index < 0) {
	              console.log('adding fav tag');
	              tag = 'fav';
	          } else {
	              console.log('removing fav tag');
	              // remove fav from modal_tags
	              removeTag($($('#image-tags').children()[fav_index]));
	          }
	      }
				console.log("adding tag: ",tags[t])
	      if (tag !== '') {
	          $('#image-tags').append(addTag(tag));
	          modal_tags.push(tag);
	      }
			}

      $('#tag-input').val('');

      map.id = hash_id;
      map.tag = modal_tags;
      
      // TODO figure out how to update fav status without adding tag - or just add tag and get over it
      
      switch(tag_type) {
          case 'add-tag-multi':
              console.log('multi case');
              socket.emit('addTagMulti', map);
              break;
          case 'add-tag-single':
              console.log('single case');
              socket.emit('addTagSingle', map);
              break;
          case 'add-tag-fav':
              console.log('fav case');
              $('#add-tag-fav').find('span').toggleClass('glyphicon-star-empty').toggleClass('glyphicon-star')
              socket.emit('addTagSingle', map);
              break;
      };

  };    

  $('.add-tag').on('click', tagSubmit);


	$('#addtoDropbox').on('click', function(e) {
		var i = $('#myModal').attr('title');
		console.log('adding to dropbox');
		socket.emit('addtoDropbox', $('#'+i).data('hash'));
	});
	
	$('#search-button').on('click', function(e) {
		e.preventDefault();
	});

	$('#search-button').on('click', function (e) {
		e.preventDefault();
	  var newdate = $('#datetimepicker2').val();
		search_tag = $('#search-input').val()
		console.log('tag: ',search_tag);
		imageMax = 0;
		$(".image-row").empty();
		console.log('socketing', newdate);
		socket.emit('initialLoad', 
			{
				imageMax : 0,
				date : newdate,
                extensions : mediaCheckbox,
				tag : search_tag	
			}
		);
	});

	$('#clear-selection-button').on('click', function () {
		$('.img-selected').each(function(i,e) {
			$(this).removeClass("img-selected");
		})
	});

	socket.on('moreImages', function (results) {
		addImages(results);		
		loaded = true;
	});

  socket.on('multiTagResult', uiTagUpdate);    
	
});
