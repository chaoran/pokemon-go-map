const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');
const PokemonGO = require('pokemon-go-node-api');
const _ = require('lodash');
const geolib = require('geolib');
const s2 = require('s2geometry-node');

const pokemonNames = JSON.parse(
  fs.readFileSync('pokemon.en.json', { encoding: 'utf8' })
);

function Scanner(options) {
  EventEmitter.call(this);

  this.pokemons = {};

  options = options || {};
  this.username = options.username || 'chaoran.rice@gmail.com';
  this.password = options.password || '13810217570';
  this.provider = options.provider || 'google';

  this.q = [];
  this.timer;

  var exec = () => {
    var task = this.q.shift();

    if (!task) {
      if (!this.coords) {
        timer = setTimeout(exec, 5000);
      } else {
        this.walk(this.coords, () => {});
        exec();
      }
      return;
    }

    task((err, tasks) => {
      if (err) {
        delete this.api;
        this.q.unshift(task);
      } else if (tasks) {
        this.q = tasks.concat(this.q);
      }

      timer = setTimeout(exec, 5000);
    });
  }

  exec();
}

util.inherits(Scanner, EventEmitter);

Scanner.prototype.load = function() {
  var now = Date.now();

  _.values(this.pokemons).forEach((pokemon) => {
    if (pokemon.expire !== null && pokemon.expire < now) {
      delete this.pokemons[pokemon.encounter_id];
    }
  });

  return _.values(this.pokemons);
};

Scanner.prototype.scan = function(coords) {
  this.walk(coords, () => { this.coords = coords; });
};

Scanner.prototype.login = function(coords, callback) {
  var api = new PokemonGO.Pokeio();

  //console.log('logging in...', {
    //username: this.username,
    //password: this.password,
    //provider: this.provider,
    //coords: coords
  //});

  api.init(this.username, this.password, {
    type: 'coords',
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: 0
    }
  }, this.provider, (err) => {
    if (err) return callback(err);

    api.GetProfile((err) => {
      if (err) return callback(err);

      this.api = api;
      callback(null);
    });
  });
};

Scanner.prototype.walk = function(coords, callback) {
  if (!this.api) {
    return this.login(coords, () => {
      this.walk(coords, callback);
    });
  }

  var points = spiral_walk(coords, 0.0015, 49);

  //console.log(points);
  this.emit('walk', points);
  this.points = points;

  this.q = points.map((p) => {
    return (callback) => this.getPokemons(p, callback);
  });

  callback();
};

Scanner.prototype.getPokemons = function(coords, callback) {
  if (!this.api) {
    return this.login(coords, () => {
      this.getPokemons(coords, callback);
    });
  }

  //console.log('getting pokemons...', coords);
  this.emit('scan', coords);

  this.api.playerInfo.latitude = coords.latitude;
  this.api.playerInfo.longitude = coords.longitude;

  this.api.Heartbeat((err, hb) => {
    if (err) return callback(err);

    for (var i = hb.cells.length - 1; i >= 0; i--) {
      for (var j = hb.cells[i].WildPokemon.length - 1; j >= 0; --j) {
        var data = hb.cells[i].WildPokemon[j];
        var timestamp = hb.cells[i].AsOfTimeMs.toNumber();

        var expire = data.TimeTillHiddenMs > 0 ?
          data.TimeTillHiddenMs + timestamp : null;

        var eid = Buffer.alloc(8);
        var l = data.EncounterId.toUnsigned();
        eid.writeInt32BE(l.high, 0);
        eid.writeInt32BE(l.low, 4);

        var pokemon = {
          id: data.pokemon.PokemonId,
          expire: expire,
          name: pokemonNames[data.pokemon.PokemonId],
          latitude: data.Latitude,
          longitude: data.Longitude,
          encounter_id: eid.toString('hex'),
        };

        if (this.pokemons[eid] !== undefined) {
          this.emit('pokemon', pokemon);
        }

        this.pokemons[eid] = pokemon;
      }

      for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; --j) {
        var data = hb.cells[i].MapPokemon[j];
        var expire = data.ExpirationTimeMs.toNumber();

        var eid = Buffer.alloc(8);
        var l = data.EncounterId.toUnsigned();
        eid.writeInt32BE(l.high, 0);
        eid.writeInt32BE(l.low, 4);

        var pokemon = {
          id: data.PokedexTypeId,
          expire: expire,
          name: pokemonNames[data.PokedexTypeId],
          latitude: data.Latitude,
          longitude: data.Longitude,
          encounter_id: eid.toString('hex'),
        };

        if (this.pokemons[eid] !== undefined) {
          this.emit('pokemon', pokemon);
        }

        this.pokemons[eid] = pokemon;
      }
    }

    callback();
  });
};

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
        latitude: 0.8 * x * step + origin.latitude + Math.random() * high,
        longitude: y * step + origin.longitude + Math.random() * high,
      });
    }
    while (2 * y * d < m && steps < limit) {
      y += d;
      steps += 1;
      coords.push({
        latitude: 0.8 * x * step + origin.latitude + Math.random() * high,
        longitude: y * step + origin.longitude + Math.random() * high,
      });
    }

    d *= -1;
    m += 1;
  }

  return coords;
}

module.exports = Scanner;
