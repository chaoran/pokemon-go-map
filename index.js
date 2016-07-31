const express = require('express');
const socket = require('socket.io')
const Scanner = require('./scanner')

var app = express();
var server = app.listen(3000);
var io = socket.listen(server);

/** Serve static files from 'public'. */
app.use(express.static('public'));

io.on('connection', function(socket){
  console.log('connected');
  var scanner = new Scanner();

  scanner.on('pokemon', function(pokemon) {
    socket.emit('pokemon', pokemon);
  });

  scanner.on('error', function(err) {
    socket.emit('error', err);
  });

  socket.on('scan', function(position) {
    scanner.scan(position);
  });
});
