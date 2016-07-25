const Pokemon = require('./pokemon');
const express = require('express');
const PokemonGO = require('pokemon-go-node-api');

var app = express();

/** Serve static files from 'public'. */
app.use(express.static('public'));

app.listen(3000);

const username = 'chaoran.rice@gmail.com';
const password = '13810217570';
const provider = 'google';

app.get('/pokemons', function(req, res, next) {
  var api = new PokemonGO.Pokeio();
  api.search = search;

  var location = {
    lat: parseFloat(req.query.lat),
    lng: parseFloat(req.query.lng)
  };
  var coords = spiral_walk(location, 0.0015, 49);

  api.init(username, password, {
    type: 'coords',
    coords: {
      latitude: location.lat,
      longitude: location.lng,
      altitude: 0
    },
  }, provider, function(err) {
    if (err) return next(err);

    api.GetProfile(function(err, profile) {
      if (err) return next(err);

      api.search(coords, [], function(err, result) {
        if (err) return next(err);
        res.send({ pokemons: result });
      });
    });
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

