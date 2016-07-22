(function() {
  function showPokemons(pokemons) {
    for (key in pokemons) {
      var pokemon = pokemons[key];
      var icon = 'img/icons/' + pokemon.pokemon_data.pokemon_id+ '.png';
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(pokemon.latitude, pokemon.longitude),
        map: map,
        icon: icon
      });
    };
  }

  window.showPokemons = showPokemons;
})(window);

