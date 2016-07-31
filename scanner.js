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
      timer = setTimeout(exec, 5000);
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
  this.q = [ ((callback) => { this.getForts(coords, callback); }) ];
};

Scanner.prototype.login = function(coords, callback) {
  var api = new PokemonGO.Pokeio();

  console.log('logging in...', {
    username: this.username,
    password: this.password,
    provider: this.provider,
    coords: coords
  });

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

Scanner.prototype.getForts = function(coords, callback) {
  if (!this.api) {
    return callback(
      null,
      [
        (callback) => { this.login(coords, callback) },
        (callback) => { this.getForts(coords, callback) }
      ]
    );
  }

  console.log('getting forts...', coords);

  this.api.playerInfo.latitude = coords.latitude;
  this.api.playerInfo.longitude = coords.longitude;

  this.api.Heartbeat((err, hb) => {
    if (err) return callback(err);

    var forts = {};

    for (var i = hb.cells.length - 1; i >= 0; i--) {
      for (var j = hb.cells[i].Fort.length - 1; j >= 0; --j) {
        var fort = hb.cells[i].Fort[j];

        if (forts[fort.FortId]) continue;

        forts[fort.FortId] = {
          latitude: fort.Latitude,
          longitude: fort.Longitude,
          id: new s2.S2CellId(
            new s2.S2LatLng(fort.Latitude, fort.Longitude)
          ).parent(15).toToken()
        };
      }
    }

    forts = _.values(forts);
    //forts = _.uniqBy(forts, 'id');
    forts = geolib.orderByDistance(coords, forts);
    forts = forts.filter((x) => x.distance < 200);
    var scans = forts.map((fort) => {
      return (callback) => this.getPokemons(fort, callback);
    });
    callback(null, scans);
  });
};

Scanner.prototype.getPokemons = function(coords, callback) {
  if (!this.api) {
    return callback(
      null,
      [
        (callback) => { this.login(coords, callback) },
        (callback) => { this.getPokemons(coords, callback) }
      ]
    );
  }

  console.log('getting pokemons...', coords);

  this.api.playerInfo.latitude = coords.latitude;
  this.api.playerInfo.longitude = coords.longitude;

  this.api.Heartbeat((err, hb) => {
    if (err) return callback(err);

    for (var i = hb.cells.length - 1; i >= 0; i--) {
      for (var j = hb.cells[i].WildPokemon.length - 1; j >= 0; --j) {
        var data = hb.cells[i].WildPokemon[j];
        var eid = data.EncounterId.toString();
        var timestamp = parseInt(hb.cells[i].AsOfTimeMs.toString());
        var expire = data.TimeTillHiddenMs > 0 ?
          data.TimeTillHiddenMs + timestamp : null;

        var pokemon = {
          id: data.pokemon.PokemonId,
          expire: expire,
          name: pokemonNames[data.pokemon.PokemonId],
          latitude: data.Latitude,
          longitude: data.Longitude,
          encounter_id: eid,
        };

        if (!this.pokemons[eid]) {
          this.emit('pokemon', pokemon);
        }

        this.pokemons[eid] = pokemon;
      }

      for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; --j) {
        var data = hb.cells[i].MapPokemon[j];
        var eid = data.EncounterId.toString();
        var expire = parseInt(data.ExpirationTimeMs.toString());

        var pokemon = {
          id: data.PokedexTypeId,
          expire: expire,
          name: pokemonNames[data.PokedexTypeId],
          latitude: data.Latitude,
          longitude: data.Longitude,
          encounter_id: eid,
        };

        if (!this.pokemons[eid]) {
          this.emit('pokemon', pokemon);
        }

        this.pokemons[eid] = pokemon;
      }
    }

    this.q.push((callback) => { this.getPokemons(coords, callback) });
    callback();
  });
};

module.exports = Scanner;
