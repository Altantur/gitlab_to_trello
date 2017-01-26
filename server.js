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
const BASE_URL = 'http://localhost:8080'

var childs = {};


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
  var hashsecret = Math.floor(Date.now()/10).toString(16)
  db.put(hashsecret, trello, function (err) {
    if(err) return console.log("Error folks!", err)
    db.get(hashsecret, function (err, value) {
      if(err) return console.log("Error folks!", err)
      var child = childProcess.fork('./server/webhook')
      child.send({
        type: "setUp",
        trello: trello,
        hashsecret: hashsecret
      })
      childs[hashsecret] = child
    })
  })
    response.send(BASE_URL + WEBHOOK_URL + "?hashsecret=" + hashsecret)
});

app.get(WEBHOOK_URL, function(request, response) {
  var hashsecret = request.query.hashsecret
  var newProcess = true
  if(childs[hashsecret]){
    childs[hashsecret].send({
      type: "webHooked",
      request: request,
      response: response
    })
  }else {
    response.send("doesn't know what you want to get here!")
  }
    response.send(hashsecret)
});

app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
  }
});
