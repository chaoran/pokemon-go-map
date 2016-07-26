(function(app) {
  var map;
  var pokemons = {};
  var openWindow, template;

  function loadPokemons() {
    var position = map.getCenter();
    if (!template) {
      template = Handlebars.compile($("#label-template").html());
    }

    $('#spinner').html('<div class="loading">Loading&#8230;</div>');

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
          pokemon.marker = marker;
        });

        $('.loading').remove();
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
        $('.loading').remove();
        Materialize.toast('An error occured. Please try again.', 5000);
      }
    });
  }

  function locateMe() {
    $('#spinner').html('<div class="loading">Loading&#8230;</div>');
    navigator.geolocation.getCurrentPosition(function(pos) {
      map.setCenter({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      $('.loading').remove();
    });
  }

  function removeHiddenPokemons() {
    for (var key in pokemons) {
      var pokemon = pokemons[key];
      var now = Date.now();

      if (now > pokemon.expire) {
        pokemon.marker.setMap(null);
        delete pokemons[key];
      }
    }
  }

  function initMap() {
    var position = Cookies.getJSON('position');

    if (!position) {
      position = { lat: 47.6205, lng: -122.3493 };
    }

    map = new google.maps.Map(document.getElementById('map'), {
      center: position, zoom: 16,
      streetViewControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
    });

    map.addListener('center_changed', function() {
      var latlng = map.getCenter();
      Cookies.set('position', latlng, { expire: 365 });
    });

    setInterval(removeHiddenPokemons, 5000);

    var btnTplt = Handlebars.compile($("#button-template").html());

    var searchBtn = document.createElement('div');
    $(searchBtn).html(btnTplt({ name: 'search', color: 'red' }));
    $(searchBtn).children('#search').on('click', loadPokemons);

    var locateBtn = document.createElement('div');
    $(locateBtn).html(btnTplt({ name: 'my_location', color: 'blue' }));
    $(locateBtn).children('#my_location').on('click', locateMe);

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(searchBtn);
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locateBtn);
  }

  app.main = initMap;
})(window);
