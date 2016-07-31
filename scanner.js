const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');
const PokemonGO = require('pokemon-go-node-api');
const _ = require('lodash');

const pokemonNames = JSON.parse(
  fs.readFileSync('pokemon.en.json', { encoding: 'utf8' })
);

function Scanner(options) {
  EventEmitter.call(this);

  this.errorThreshold = 10;
  this.seen = {};
  this.positions = [];

  options = options || {};
  this.username = options.username || 'chaoran.rice@gmail.com';
  this.password = options.password || '13810217570';
  this.provider = options.provider || 'google';

  this.api = new PokemonGO.Pokeio();

  this.search();
  this.clean();
}

util.inherits(Scanner, EventEmitter);

Scanner.prototype.clean = function() {
  var now = Date.now();

  Object.keys(this.seen).forEach((key) => {
    var pokemon = this.seen[key];
    if (pokemon.expire !== null && pokemon.expire < now) {
      delete this.seen[key];
    }
  });

  this.cleanHandle = setTimeout(() => { this.clean() });
};

Scanner.prototype.scan = function(position) {
  if (!this.ready) return this.login(position, (err) => {
    if (err) this.emit('error', err);
    else this.scan(position);
  });

  /** Walk around the given point. */
  this.positions = spiral_walk(position, 0.0015, 49);
}

Scanner.prototype.search = function(coords, retries) {
  if (!retries) retries = 0;
  if (!coords) coords = this.positions.shift();
  if (!coords) {
    this.searchHandle = setTimeout(() => { this.search(); });
    return;
  }

  console.log('searching', coords);

  this.api.playerInfo.latitude = coords.lat;
  this.api.playerInfo.longitude = coords.lng;

  this.api.Heartbeat((err, hb) => {
    if (err) {
      retries += 1;
      console.log('retrying');

      if (retries === this.errorThreshold) {
        this.emit('error', err);
        console.log(err);
      }
    } else {
      retries = 0;
      this.parseHeartbeat(hb);
      coords = undefined;
    }

    this.searchHandle = setTimeout(() => {
      this.search(coords, retries);
    }, 500);
  });
}

Scanner.prototype.parseHeartbeat = function(hb) {
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

      if (!_.isEqual(this.seen[eid], pokemon)) {
        console.log(pokemon);
        this.emit('pokemon', pokemon);
        this.seen[eid] = pokemon;
      }
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

      if (!_.isEqual(this.seen[eid], pokemon)) {
        console.log(pokemon);
        this.emit('pokemon', pokemon);
        this.seen[eid] = pokemon;
      }
    }
  }
}

Scanner.prototype.login = function(position, callback, retries) {
  if (!retries) retries = 0;

  this.api.init(
    this.username,
    this.password,
    {
      type: 'coords',
      coords: {
        latitude: position.lat,
        longitude: position.lng,
        altitude: 0
      }
    },
    this.provider,
    (err) => {
      if (err) {
        retries += 1;

        if (retries === this.errorThreshold) {
          this.emit('error', err);
        }
      } else {
        retries = 0;
        this.api.GetProfile((err) => {
          if (err) {
            retries += 1;

            if (retries === this.errorThreshold) {
              this.emit('error', err);
            }
          } else {
            retries = 0;
            this.ready = true;
            callback(null);
          }
        });
      }
    }
  );
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


module.exports = Scanner;
