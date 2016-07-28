const execFile = require('child_process').execFile;
const Pokemon = require('./pokemon');
const express = require('express');

var app = express();

/** Serve static files from 'public'. */
app.use(express.static('public'));

app.listen(3000);

const provider = 'google';
const username = 'chaoran.rice@gmail.com';
const password = '13810217570';

app.get('/pokemons', function(req, res, next) {
  var position = req.query;

  scan(position, (err, result) => {
    if (err) {
      console.log(err);
      next(err);
    }
    else res.send(result);
  });
});

function spiral_walk(origin, step, limit) {
  var coords = [ origin ];
  var x = 0, y = 0;
  var d = 1, m = 1;
  var high = 0.0005;
  var steps = 1;

  while (steps < limit) {
    while (2 * x * d < m && steps < limit) {
      x += d;
      steps += 1;
      coords.push({
        lat: x * step + origin.lat + Math.random() * high,
        lng: y * step + origin.lng + Math.random() * high,
      });
    }
    while (2 * y * d < m && steps < limit) {
      y += d;
      steps += 1;
      coords.push({
        lat: x * step + origin.lat + Math.random() * high,
        lng: y * step + origin.lng + Math.random() * high,
      });
    }

    d *= -1;
    m += 1;
  }

  return coords;
}

function search(coords, result, callback) {
  var coord = coords.shift();
  if (!coord) return callback(null, result);

  this.playerInfo.latitude = coord.lat;
  this.playerInfo.longitude = coord.lng;

  var that = this;

  this.Heartbeat(function(err, hb) {
    if (err) return callback(err);

    for (var i = hb.cells.length - 1; i >= 0; i--) {
      for (var j = hb.cells[i].WildPokemon.length - 1; j >= 0; --j) {
        var pokemonData = hb.cells[i].WildPokemon[j];
        result.push(new Pokemon(pokemonData));
      }
    }

    that.search(coords, result, callback);
  });
}

function scan(position, callback) {
  console.log('searching for pokemons at (%d, %d)', position.lat, position.lng);

  var command = [
    'pogo/demo.py',
    '-a', provider,
    '-u', username,
    '-p', password,
    '-l', position.lat + ' ' + position.lng
  ];
  execFile('python', command, function(err, stdout, stderr) {
    if (err) {
      return callback(stderr);
    }

    var result;

    try {
      result = JSON.parse(stdout);
    } catch (e) {
      return callback(stderr);
    }

    var pokemons = Object.keys(result).map(
      (key) => new Pokemon(result[key])
    );

    console.log('found %d pokemons', pokemons.length);
    return callback(null, { pokemons: pokemons });
  });
}
