var express = require('express');
var app = express();
var config = require('fs').readFile('/etc/homeserv.conf');

var MongoClient = require('mongodb').MongoClient;

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
var io = require('socket.io')(server);


app.use(express.static(__dirname + '/public'));
app.use(express.static('/Volumes/SATA 1500/homeserv_media/'))

app.get('/', function (req, res) {

  res.sendFile('/Users/matt/code/homeserv/homeserv.html');
	
});


io.on('connection', function (socket) {

	console.log('user connected');
  // when the client emits 'new message', this listens and executes
  
	MongoClient.connect("mongodb://localhost:27017/homeserv", function(err, db) {
	  if(!err) {
	    console.log("We are connected");
			var collection = db.collection('media');

			

		  socket.on('initialLoad', function (map) {

				console.log('loading');		

			
				var cursor = collection.find({
					"Datetime" : { $gte : new Date(map.date) }
						},
						{},
						{ limit : 20 }
					).toArray(function(err, items) {
						console.log('sending more images');
				    socket.emit('moreImages', {
				      data: items
				    });
					})

				socket.on('loadMore', function (max) {
					// send more data on request
					console.log(max);
					collection.find( 
						{
							Datetime : 
							{
								"$gt" : new Date(max) 
							} 
						})
					.limit(20)
					.sort(
						{
							Datetime : 1
						})
						.toArray(function(err, items) {
					    socket.emit('moreImages', {
					      data: items
					    });
							
						})
						
			  });

		  }
		);
  } else {console.log(err)}

});
});


//			    cursor.on('data', function(doc) {
						//console.log(doc);
//			      images.push(doc);
//			    });
