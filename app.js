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
app.get('/', function (req, res) {
	pg.select('id')
		.from('media')
		.asCallback( function ( err, rows ) {
//			console.log(rows);
		})
  res.sendFile('/Users/matt/code/homeserv/homeserv.html');
	
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
