require('dotenv').config({path: './.env'});
var path = require('path'),
    express = require('express'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    low = require('lowdb'),
    fileAsync = require('lowdb/lib/file-async'),
    childProcess = require('child_process'),
    axios = require('axios'),
    Trello = require('node-trello'),
    db = low('db.json', {
      storage: fileAsync
    }),
    app = express();

const PORT = process.env.PORT || 8080;
const WEBHOOK_URL = '/webhook'
const BASE_URL = process.env.BASE_URL + ':' + process.env.PORT

db.defaults({ boards: [] }).value()
const boards = db.get('boards')

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
  var board = boards.find({id: trello.boardId}).last().value()

  if(!board){
    board = {id: trello.boardId, data: {trello: trello, gitlab: gitlab}}
    console.log(board);
    boards.push(board).last().value()
  }
  response.send("Succesfully associated!")
});

app.post('/trelloCallback', function(request, response) {
  if(Object.keys(request.body).length !== 0){
    var type = request.body.action.type
    var action = request.body.action
    var gitlab = null
    var board = boards.find({id: request.body.model.id}).value()
    console.log(board);
    gitlab = board.data.gitlab
    var gitlabAPI = axios.create({
        baseURL: 'http://gitlab.unimedia.mn/api/v3',
        headers: {
            'PRIVATE-TOKEN': gitlab.token
        }
    })
    var t = new Trello("606e8e43f53447a2819dd630338306aa", board.data.trello.token)
    switch (type) {
        case "addChecklistToCard":
          console.log("Triggered by : addChecklistToCard");
          console.log(action.data);
          break;
        case "createCard":
          console.log("Triggered by : createCard");
          gitlabAPI.post(`/projects/${gitlab.projectId}/issues`, {
            "title" : action.data.card.name
          }).then((response) => {
            console.log(response);
            var issues = board.data.issues ? board.data.issues : []
            issues.push({cardId: action.data.card.id, issueId: response.data.iid})
            board.data.issues = issues
            db.write()
          })
          console.log(action.data);
          break;
        case "updateCard":
          console.log("Triggered by : updateCard");
          for (var i = 0; i < board.data.issues.length; i++) {
            if(board.data.issues[i].cardId === action.data.card.id) {
              gitlabAPI.put(`/projects/${gitlab.projectId}/issues/${board.data.issues[i].issueId}`, {
                "title" : action.data.card.name
              }).then((value) => {
                console.log(value.data);
              })
            }
          }
          console.log(action.data);
          break;
        case "addLabelToCard":
          console.log("Triggered by : addLabelToCard");
          var dics = ["gitlab", "issue", "git", "bug"]
          var isIssue = false
          for (var i = 0; i < dics.length; i++) {
            isIssue = action.data.text.includes(dics[i])
          }
          if (isIssue) {
            var isAlreadyIssue = false
            for (var i = 0; i < board.data.issues.length; i++) {
              isAlreadyIssue = board.data.issues[i].cardId === action.data.card.id
            }
            if (!isAlreadyIssue) {
                t.get(`/1/cards/${action.data.card.id}`, function (err, data) {
                  if(err) throw err
                  gitlabAPI.post(`/projects/${gitlab.projectId}/issues`, {
                    "title" : data.name,
                    "description" : data.desc,
                    "due_date" : data.due
                  }).then((response) => {
                    console.log(response);
                    var issues = board.data.issues ? board.data.issues : []
                    issues.push({cardId: action.data.card.id, issueId: response.data.iid})
                    board.data.issues = issues
                    db.write()
                  })
                })
            }
          }
          console.log(action.data);
          break;
        case "removeLabelFromCard":
          console.log("Triggered by : removeLabelFromCard");
          console.log(action.data);
          break;
        case "commentCard":
          console.log("Triggered by : commentCard");
          console.log(action.data);
          break;
        case "createList":
          console.log("Triggered by : createList");
          var name = action.data.list.name
          console.log(name);
          gitlabAPI.post(`/projects/${gitlab.projectId}/labels`, {
            "title" : name
          }).then((value) => {
            console.log(value);
          })
          break;
        default:
      }
  }


  response.sendStatus(200)
});

app.get('/trelloCallback', function(request, response) {
  response.sendStatus(200)
});

app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
  }
});
