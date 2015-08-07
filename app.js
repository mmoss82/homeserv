var express = require('express');
var app = express();
var config = require('fs').readFile('/etc/homeserv.conf')

var MongoClient = require('mongodb').MongoClient;



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


app.get('/images', function (req, res) {
/*	pg.select('*	')
		.from('media')
		.limit(100)
		.asCallback( function ( err, rows ) {
//			shuffle(rows);
			res.json(rows.slice(0,100));
		})
	});
	*/
	MongoClient.connect("mongodb://localhost:27017/homeserv", function(err, db) {
	  if(!err) {
	    console.log("We are connected");
			var collection = db.collection('media');
//			console.log(collection);
			collection.find({},{},{ limit : 5000 }).toArray(function(err, items) {
				console.log(items);
				res.json(shuffle(items.slice(0,200)));
				db.close();		
				
			});
	  }
	});
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
