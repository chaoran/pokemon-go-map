const express = require('express');
const socket = require('socket.io')
const _ = require('lodash');
const nodemailer = require('nodemailer');
const Scanner = require('./scanner');
const whitelist = require('./whitelist');

var app = express();

/** Serve static files from 'public'. */
app.use(express.static('public'));

var server = app.listen(3000);
var io = socket.listen(server);
var scanner = new Scanner();
var transporter = nodemailer.createTransport({
  host: 'smtp.mail.rice.edu',
  port: 465,
  secure: true,
  auth: {
    user: 'cy6',
    pass: '9929cha0ran'
  }
});

scanner.on('pokemon', function(pokemon) {
  console.log('found: ', pokemon);

  if (whitelist[pokemon.id]) {
    var expire = pokemon.expire;
    var mm, ss;

    if (expire !== null) {
      expire -= Date.now();
      mm = Math.floor(expire / 60000);
      ss = Math.floor((expire / 1000) % 60);
    } else {
      mm = 'UNKNOWN';
      ss = 'UNKNOWN';
    }

    transporter.sendMail({
      from: '"Chaoran Yang" <chaoran@rice.edu>',
      to: '"Chaoran Yang" <chaorany@me.com>',
      subject: 'A "' + pokemon.name + '" is near you!',
      text: [
        'It will disappear in ', mm, 'm', ss, 's.\n',
        'Find out more at: https://pogo.soymind.com .\n',
        JSON.stringify(pokemon, null, 4)
      ].join('')
    }, function(error, info) {
      if (error) return console.log(error);
      console.log('Message sent: ' + info.response);
    });
  }
});

scanner.on('error', function(err) {
  console.log(err);
});

/** Default coordinates. */
scanner.scan({
  latitude: 47.62377406618277,
  longitude: -122.3560552656067
});

io.on('connection', function(socket){
  scanner.load().forEach(function(pokemon) {
    socket.emit('pokemon', pokemon);
  });

  if (scanner.points) {
    socket.emit('walk', scanner.points);
  }

  function emitPokemon(pokemon) {
    socket.emit('pokemon', pokemon);
  }
  function emitError(err) {
    socket.emit('error', err);
  }
  function emitScan(coords) {
    socket.emit('scan', coords);
  }
  function emitWalk(points) {
    socket.emit('walk', points);
  }

  scanner.on('pokemon', emitPokemon);
  scanner.on('error', emitError);
  scanner.on('scan', emitScan);
  scanner.on('walk', emitWalk);

  socket.on('scan', function(position) {
    scanner.scan({ latitude: position.lat, longitude: position.lng });
  });

  socket.on('disconnect', function() {
    scanner.removeListener('pokemon', emitPokemon);
    scanner.removeListener('error', emitError);
    scanner.removeListener('scan', emitScan);
    scanner.removeListener('walk', emitWalk);
  });
});
