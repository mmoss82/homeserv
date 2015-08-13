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




/*
var pg = require('knex')({
  client: 'pg',
  connection: {
    host     : 'localhost',
    user     : 'matt',
		password : config.pass,
    database : 'homeserv'
  }
});
*/

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

app.use(express.static(__dirname + '/public'));
app.use(express.static('/Volumes/SATA 1500/homeserv_media/'))

app.get('/', function (req, res) {

  res.sendFile('/Users/matt/code/homeserv/homeserv.html');
	
});


io.on('connection', function (socket) {
  var addedUser = false,
	images = [];

	console.log('user connected');
	

	socket.on('loadMore', function (max) {
			// send more data on request
		console.log(max);
		
	    socket.emit('moreImages', {
	      data: images.slice(max,max+10)
	    });
	  });
	
	
  // when the client emits 'new message', this listens and executes
  socket.on('initialLoad', function (map) {
		console.log('loading');
		MongoClient.connect("mongodb://localhost:27017/homeserv", function(err, db) {
		  if(!err) {
		    console.log("We are connected");
				var collection = db.collection('media');
			

				var cursor = collection.find({
						"CreationDate" : { $gte : new Date(map.date) }
					},
					{}
//					{ limit : 2000 }
				);
				    cursor.on('data', function(doc) {
							//console.log(doc);
				      images.push(doc);
				    });
/*
				    cursor.once('end', function() {
				      db.close();
				    });
	
				collection.find(
					{
						"Datetime" : { $gte : new Date("2010/01/01") }
					}
				).on(data, )(function(err, items) {
					console.log(items);
				});
				*/
				/*
				collection.find({},{},{ limit : 10 }).toArray(function(err, items) {
					if (err) {console.log(err);}
					console.log(items);
					res.json(items);//shuffle(items.slice(0,200)));
					db.close();		
				});
				*/
		  }
		});
  });

});


