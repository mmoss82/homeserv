var express = require('express');
var app = express();
var config = require('fs').readFile('/etc/homeserv.conf');

var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var fs = require('fs');
var homeDir = '/Users/matt/code/homeserv/';
//var privateKey  = fs.readFileSync(homeDir+'/ssl/server.key', 'utf8');
//var certificate = fs.readFileSync(homeDir+'/ssl/server.crt', 'utf8');
var path = require('path');
//var options = {key: privateKey, cert: certificate};
var imageDir = '/Volumes/SATA 1500/homeserv_media/'
var server = http.createServer(app);
var Keychain = require( '1password' ),
    keychain = new Keychain();

//keychain.load( './1Password.agilekeychain/data', function( err ) {
//    console.log('err',err);
//    console.log( 'Keychain has loaded' ); 
//});

server.listen(3000);

var io = require('socket.io')(server);


app.use(express.static(__dirname + '/public'));
app.use(express.static('/Volumes/SATA 1500/'))

app.get('/', function (req, res) {
  res.sendFile('/Users/matt/code/homeserv/homeserv.html');
});

app.get('/mov/:url*',function(req,res) {
	console.log('/mov/url/',req.params.url+req.params[0]);
	var file = path.resolve('/'+req.params.url+req.params[0]);
	var range = req.headers.range;
	
	fs.stat(file, function(err, stats) {
		var total = stats.size;		           
		res.writeHead(206, {
			"Accept-Ranges": "bytes",
			"Content-Type": "video/mp4"
		});
		var stream = fs.createReadStream(file)
			.on("open", function() {
				stream.pipe(res);
			}).on("error", function(err) {
				console.log(err);
				res.end(err);
			});
	});
})

app.get('/:url*', function (req, res) {
	console.log(req.params.url+req.params[0]);        
	res.sendFile(imageDir+req.params.url+req.params[0]);
})

MongoClient.connect("mongodb://localhost:27017/homeserv", function(err, db) {
  if(!err) {
    console.log("We are connected");
		var collection = db.collection('media');

		io.on('connection', function (socket) {
			console.log('user connected');
			
		  socket.on('initialLoad', function (map) {
				console.log(map);
				console.log('loading date: ',new Date(map.date));

				console.log('Tags: '+  map.tag);
				console.log('Date: '+  map.date);
				
				for (var i in map) {
					if (map.hasOwnProperty(i)) {
						map[i] = map[i] || '';
					}
				}
				
				var cursor = collection.find( 
                    { $or : [
                        { OriginalPath : {$regex : map.tag} },
                        { tags : {$regex : map.tag} }
                            ]
                    ,
                    OriginalDateTime : { $gt : new Date(map.date)
										}
                        },
						{},
						{ limit : 20 }
					).sort({
							OriginalDateTime : 1
						}).toArray(function(err, items) {
						console.log('sending more images');
				    socket.emit('moreImages', {
				      data: items
				    });
					})
				}
			);

// { $addToSet: { <field1>: <value1>, ... } }

        var updateField = function (map, callback) {
            collection.updateMany(
               map.find_map,
               map.change_map,
               function (err, result) {
                   callback(err, result)
               }
               );
        };

        socket.on('addTagMulti', function (map) {
            console.log('adding tag for multi files: ',map);
            
            collection.findOne(
                { _id: map.id}, function (err, result) {
                    console.log('result: ',result)
                    if (err) { console.log('error finding match for tag source file'), err }
                    else {
                        console.log('found tag source match!');
                        var originalPath = path.dirname(result.OriginalPath); 
                        var updateMap = {};
                        
                        updateMap.find_map = { 'OriginalPath' : { $regex : originalPath } };
                        updateMap.change_map = { $push : {'tags' : map.tag } };
                        
                        updateField(updateMap, function (err, result) {
                            if (err) {
                                console.log('error adding tags to multi files');
                            } else {
                                console.log('success adding tags to multi files');
                            }
                        });
                        
                        var cursor = collection.find(
                            updateMap.find_map, 
                            {'_id':1,'OriginalPath':1}, 
                            {}
                            ).toArray( function (err, items) {
                                if (err) {
                                    console.log('error finding multi edit results',err);
                                } else {
                                    console.log('success finding multi edit results');
                                    socket.emit(
                                        'multiTagResult',
                                        { 
                                            data : items,
                                            tag : map.tag 
                                        }
                                        );
                                };
                        });

                        
                    }
                } 
            );
          });
           socket.on('addTagSingle', function (map) {
               console.log('updating tags for single file');
               var updateMap = {};
               updateMap.find_map = { '_id' : map.id };
               updateMap.change_map = { $push : {'tags' : map.tag }};
                
               updateField( updateMap, function (err, result) {
                   if (err) {
                       console.log( 'error adding tags to single file', err );
                   } else {
                       console.log( 'success adding tags to single file' );
                       socket.emit('multiTagResults',result);
                   }
               }); 

           });
            /*
			socket.on('loadMore', function (max) {
				// send more data on request
				console.log(max);
				collection.find({
					OriginalDateTime : {
							"$gt" : new Date(max) 
						} 
					})
				.limit(20)
				.sort({
						OriginalDateTime : 1
					})
					.toArray(function(err, items) {
				    socket.emit('moreImages', {
				      data: items
				    });
					})
			  }
			);
			*/
			socket.on('addtoDropbox', function(hash_id) {
				console.log('dropboxing',hash_id);
				collection.findOne({_id:hash_id}, function (err, result) {
					console.log(result);
					var pathSplit = result.OriginalPath.split('/');
					var filename = pathSplit[pathSplit.length-1];
					var originalPath = result.OriginalPath;
					var dest = '/Users/matt/Dropbox/homeserv/'+hash_id+'_'+filename;
					fs.createReadStream(originalPath).pipe(fs.createWriteStream(dest));
				})
			});		  
		});
	} else {
			console.log(err)
		}
});

