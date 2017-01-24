var path = require('path'),
    express = require('express'),
    app = express(),
    createHandler = require('./server/gitlab-webhook-handler'),
    Trello = require('node-trello'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    levelup = require('levelup'),
    db = levelup('./trellodb');
const PORT = process.env.PORT || 8080;
const TRELLO_KEY = '606e8e43f53447a2819dd630338306aa'
const TRELLO_TOKEN = '4c8f2d39e4174b71ad618ba605f58ddea6c36d842cd193b66154def68417871a'
const WEBHOOK_URL = '/webhook'
const WEBHOOK_SECRET = 'myhashsecret'
const BASE_URL = 'http://localhost:8080'

var handler = createHandler({ path: WEBHOOK_URL, secret:  WEBHOOK_SECRET})
var t = new Trello(TRELLO_KEY, TRELLO_TOKEN)

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
    trelloToken : request.body.trelloToken,
    boardId : request.body.boardId
  }
  var hashsecret = Math.floor(Date.now()/10).toString(16)
  db.put(hashsecret, trello, function (err) {
    if(err) return console.log("Error folks!", err);
    db.get(hashsecret, function (err, value) {
      if(err) return console.log("Error folks!", err);
    })
  })
    response.send(BASE_URL + WEBHOOK_URL + "?hashsecret=" + hashsecret)
});

app.get(WEBHOOK_URL, function(request, response) {
  handler(request, response, function(err){
    response.statusCode = 404
    response.sendFile(__dirname + '/dist/index.html')
  });
});

app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
  }
});

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('issue', function (event) {
  //   console.log('Received an issue event for %s action=%s: #%d %s',
  //   event.payload.repository.name,
  //   event.payload.action,
  //   event.payload.issue.number,
  //   event.payload.issue.title)
  console.log(JSON.stringify(event));
})

// handler.on('note', function (event) {
// })
