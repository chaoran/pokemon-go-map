const execFile = require('child_process').execFile;
const Pokemon = require('./pokemon');
const express = require('express');

var app = express();

/** Serve static files from 'public'. */
app.use(express.static('public'));

app.get('/pokemons', function(req, res) {
  var position = req.query;
  var command = [
    'spiral_poi_search.py',
    '-a', 'google',
    '-u', 'chaoran.rice@gmail.com',
    '-p', '13810217570',
    '-l', position.lat + ' ' + position.lng
  ];

  console.log('executing %s', command);
  execFile('python', command, function(err, stdout, stderr) {
    console.log(stdout)
    console.log(stderr)

    if (err) {
      res.send(stderr);
    } else {
      var result = JSON.parse(stdout);
      var pokemons = result.pokemons;
      var list = [];

      for (var key in pokemons) {
        list.push(new Pokemon(pokemons[key]));
      }

      console.log(list);
      res.send({ pokemons: list });
    }
  });
});

app.listen(3000);
