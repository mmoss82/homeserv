var express = require('express');
var app = express();

var pg = require('knex')({
  client: 'pg',
  connection: {
    host     : 'localhost',
    user     : 'matt',
		password : 'mo55w3sl3y!?',
    database : 'homeserv'
  }
});
app.use(express.static(__dirname + '/public'));
app.use(express.static('/Volumes/SATA 1500/homeserv_media/'))

app.get('/', function (req, res) {

  res.sendFile('/Users/matt/code/homeserv/homeserv.html');
	
});


app.get('/images', function (req, res) {
	pg.select('*	')
		.from('media')
		.limit(2000)
		.asCallback( function ( err, rows ) {
			res.json(rows.slice(0,2000));
		})
	});
var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
