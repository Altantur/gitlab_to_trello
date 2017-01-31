require('dotenv').config({path: './.env'});
var path = require('path'),
    express = require('express'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    levelup = require('levelup'),
    childProcess = require('child_process'),
    axios = require('axios'),
    app = express(),
    db = levelup('./trellodb');


const PORT = process.env.PORT || 8080;
const WEBHOOK_URL = '/webhook'
const BASE_URL = process.env.BASE_URL + ':' + process.env.PORT

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
  db.get(trello.boardId, function (err, value) {
    // If error occurS!
    if(err){
      db.put(trello.boardId, {trello: trello, gitlab: gitlab}, function (err) {
        // If error occurS!
        if(err) return console.log("Error folks!", err)

      })
      return console.log("Error folks!", err)
    }
  })
    response.send("Succesfully associated!")
});

app.post('/trelloCallback', function(request, response) {
  console.log(request.body);
  response.sendStatus(200)
});

app.get('/trelloCallback', function(request, response) {
  var boardId = request.body.model.id
  var type = request.body.action.type
  var action = request.body.action
  var gitlab = null
  db.get(boardId, function (err, value) {
    if(err) return console.log("something went wrong!")
    gitlab = value.gitlab
    let gitlabAPI = axios.create({
        baseURL: 'http://gitlab.unimedia.mn/api/v3',
        headers: {
            'PRIVATE-TOKEN': gitlab.token
        }
    })

    switch (type) {
      case "addChecklistToCard":

        break;
      case "createCard":

        break;
      case "updateCard":

        break;
      case "addLabelToCard":

        break;
      case "removeLabelFromCard":

        break;
      case "commentCard":

        break;
      case "createList":
        let name = action.data.list.name
        gitlabAPI.post(`/projects/${gitlab.projectId}/labels`, {
          "name" : name
        })
        break;
      case "commentCard":

        break;
      case "commentCard":

        break;
      default:

    }
  })
  response.sendStatus(200)
});

app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
  }
});
