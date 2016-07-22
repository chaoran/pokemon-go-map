const fs = require('fs');
const pokemonNames = JSON.parse(
  fs.readFileSync('pokemon.en.json', { encoding: 'utf8' })
);

function Pokemon(raw) {
  this.id = raw.pokemon_data.pokemon_id;
  this.name = pokemonNames[this.id];
  this.latitude = raw.latitude;
  this.longitude = raw.longitude;
  this.expire = raw.time_till_hidden_ms;
}

module.exports = Pokemon;
