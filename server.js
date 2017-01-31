require('dotenv').config({path: './.env'});
var path = require('path'),
    express = require('express'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    levelup = require('levelup'),
    childProcess = require('child_process'),
    app = express(),
    db = levelup('./trellodb');


const PORT = process.env.PORT || 8080;
const WEBHOOK_URL = '/webhook'
const BASE_URL = process.env.BASE_URL + ':' + process.env.PORT

var childs = {};
console.log("Hi there app! Port is :  " + process.env.PORT);

// using webpack-dev-server and middleware in development environment
if(process.env.NODE_ENV !== 'production') {
  var webpackDevMiddleware = require('webpack-dev-middleware');
  var webpackHotMiddleware = require('webpack-hot-middleware');
  var webpack = require('webpack');
  var config = require('./webpack.config');
  var compiler = webpack(config);

  app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
}

app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/dist/index.html')
});

app.post('/setwebhook', function(request, response) {
  var trello = {
    token : request.body.trelloToken,
    boardId : request.body.boardId
  }
  var gitlab = {
    token : request.body.gitlabToken,
    projectId : request.body.gitlabProjectId
  }
  // db.get(hashsecret, function (err, value) {
  //   // If error occurS!
  //   if(err) return console.log("Error folks!", err)
  //
  // })
  // db.put(hashsecret, trello, function (err) {
  //   // If error occurS!
  //   if(err) return console.log("Error folks!", err)
  //
  // })
    response.send("Succesfully associated!")
});

app.post('/trelloCallback', function(request, response) {
  console.log(request);
});

app.get('/trelloCallback', function(request, response) {
  console.log(request);
});

app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
  }
});
