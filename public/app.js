(function(app) {
  var map;
  var pokemons = {};
  var openWindow, template;

  function loadPokemons() {
    var position = map.getCenter();
    Cookies.set('position', position.toJSON());

    $('#spinner').html('<div class="loading">Loading&#8230;</div>');

    if (!template) {
      template = Handlebars.compile($("#label-template").html());
    }

    $.ajax({
      url: "/pokemons",
      data: position.toJSON(),
      success: function(result) {
        if (result.error) {
          $("body").html(result.error);
          return;
        }

        result.pokemons.forEach(function(pokemon) {
          if (pokemons[pokemon.encounter_id]) return;

          pokemons[pokemon.encounter_id] = pokemon;

          var icon = 'img/icons/' + pokemon.id + '.png';
          var info = new google.maps.InfoWindow();
          var marker = new google.maps.Marker({
            position: { lat: pokemon.latitude, lng: pokemon.longitude },
            map: map, icon: icon,
          });
          marker.addListener('click', function() {
            if (openWindow) openWindow.close();
            info.setContent(template({
              name: pokemon.name,
              disappear_time: ((pokemon.expire -
                                Date.now())/60000).toFixed(2),
              lat: pokemon.latitude,
              lng: pokemon.longitude
            }));
            info.open(map, marker);
            openWindow = info;
          });
          setTimeout(function() {
            marker.setMap(null);
            delete pokemons[pokemon.encounter_id];
          }, pokemon.expire);
        });

        $('.loading').remove();
      }
    });
  }

  function initMap() {
    var position = Cookies.get('position');

    if (position) {
      try {
        position = JSON.parse(position);
      } catch (e) {}
    } else {
      position = { lat: 47.6205, lng: -122.3493 };
    }

    map = new google.maps.Map(document.getElementById('map'), {
      center: position, zoom: 16,
      streetViewControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
    });

    var button = document.createElement('div');

    $(button).html($('#button-template').html());
    $(button).children('#refresh-pokemon').on('click', loadPokemons);

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(button);
  }

  app.main = initMap;
})(window);
