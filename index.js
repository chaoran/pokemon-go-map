const express = require('express');
const socket = require('socket.io')
const _ = require('lodash');
const nodemailer = require('nodemailer');
const Scanner = require('./scanner');
const whitelist = require('./whitelist');

var app = express();
var server = app.listen(3000);
var io = socket.listen(server);
var scanner = new Scanner();

scanner.on('pokemon', function(pokemon) {
  console.log('found: ', pokemon);
});

var transporter = nodemailer.createTransport({
  host: 'smtp.mail.rice.edu',
  port: 465,
  secure: true,
  auth: {
    user: 'cy6',
    pass: '9929cha0ran'
  }
});

/** Serve static files from 'public'. */
app.use(express.static('public'));

io.on('connection', function(socket){
  scanner.load().forEach(function(pokemon) {
    socket.emit('pokemon', pokemon);
  });

  scanner.on('pokemon', function(pokemon) {
    socket.emit('pokemon', pokemon);
    if (whitelist[pokemon.id]) {
      transporter.sendMail({
        from: '"Chaoran Yang" <chaoran@rice.edu>',
        to: '"Chaoran Yang" <chaorany@me.com>',
        subject: 'A "' + pokemon.name + '" is near you!',
        text: 'Find out where it is: https://45.55.28.100'
      }, function(error, info) {
        if (error) return console.log(error);
        console.log('Message sent: ' + info.response);
      });
    }
  });

  scanner.on('error', function(err) {
    console.log(err);
    socket.emit('error', err);
  });

  socket.on('scan', function(position) {
    scanner.scan({ latitude: position.lat, longitude: position.lng });
  });
});
