/**
 * Created by sahin on 16.4.2015.
 */
// Burası node ile projeyi calistirabilmek icin kullanilacaktir.
var express = require('express'),
  app = express(),
  server = require('http').Server(app);
  //bodyParser = require('body-parser');
  // db = require('./db'),
  // io = require('./sockets').listen(server),
  // apiRoutes = require('./routes/api'),
  // webRoutes = require('./routes/web');

// app.use(bodyParser.json());
/* app.use(bodyParser.urlencoded({
  extended: true
}));
*/
// app.use('/api', apiRoutes);
// app.use(express.static(__dirname + '/public'));
// Here's the new code:
app.use('/*', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

server.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
