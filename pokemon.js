const fs = require('fs');
const pokemonNames = JSON.parse(
  fs.readFileSync('pokemon.en.json', { encoding: 'utf8' })
);

function Pokemon(raw) {
  this.id = raw.id
  this.name = pokemonNames[this.id];
  this.latitude = raw.latitude;
  this.longitude = raw.longitude;
  this.expire = raw.expire_time;
  this.encounter_id = raw.encounter_id.toString();
}

module.exports = Pokemon;
