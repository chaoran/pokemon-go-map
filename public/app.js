(function(app) {
  var map;
  var pokemons = {};
  var openWindow, template;
  var socket = io();

  if (!template) {
    template = Handlebars.compile($("#label-template").html());
  }

  socket.on('error', function(err) {
    console.log(err);
  });

  var path;

  socket.on('walk', function(points) {
    if (path) path.setMap(null);

    path = new google.maps.Polyline({
      path: points.map(function(p) {
        return { lat: p.latitude, lng: p.longitude }
      }),
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 4
    });

    path.setMap(map);
  });

  var scanMarker;

  socket.on('scan', function(coords) {
    if (scanMarker) scanMarker.setMap(null);

    scanMarker = new google.maps.Marker({
      position: {
        lat: coords.latitude,
        lng: coords.longitude
      },
      map: map
    });
  });

  socket.on('pokemon', function(pokemon) {
    console.log('received', pokemon);

    if (pokemons[pokemon.encounter_id]) {
      pokemons[pokemon.encounter_id].marker.setMap(null);
      delete pokemons[pokemon.encounter_id];
    }

    pokemons[pokemon.encounter_id] = pokemon;

    var icon = 'img/icons/' + pokemon.id + '.png';
    var info = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
      position: { lat: pokemon.latitude, lng: pokemon.longitude },
      map: map, icon: icon,
    });
    marker.addListener('click', function() {
      if (openWindow) openWindow.close();
      var expire = pokemon.expire - Date.now();
      info.setContent(template({
        name: pokemon.name,
        disappear_time: {
          mm: (expire/60000).toFixed(0),
          ss: ((expire%60000)/1000).toFixed(0),
        },
        lat: pokemon.latitude,
        lng: pokemon.longitude
      }));
      info.open(map, marker);
      openWindow = info;
    });

    pokemon.marker = marker;
  });

  function loadPokemons() {
    var position = map.getCenter();
    socket.emit('scan', position);
  }

  function locateMe() {
    navigator.geolocation.getCurrentPosition(function(pos) {
      map.setCenter({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  }

  function removeHiddenPokemons() {
    for (var key in pokemons) {
      var pokemon = pokemons[key];
      var now = Date.now();

      if (pokemon.expire !== null && now > pokemon.expire) {
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
