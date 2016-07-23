const fs = require('fs');
const pokemonNames = JSON.parse(
  fs.readFileSync('pokemon.en.json', { encoding: 'utf8' })
);

function Pokemon(raw) {
  this.id = raw.pokemon.PokemonId;
  this.name = pokemonNames[this.id];
  this.latitude = raw.Latitude;
  this.longitude = raw.Longitude;
  this.expire = Date.now() + raw.TimeTillHiddenMs;
  this.encounter_id = raw.EncounterId.toString();
}

module.exports = Pokemon;
