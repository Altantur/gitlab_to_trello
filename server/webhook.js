var createHandler = require('./server/gitlab-webhook-handler'),
    Trello = require('node-trello');

const TRELLO_KEY = '606e8e43f53447a2819dd630338306aa'
const TRELLO_TOKEN = ''
const WEBHOOK_SECRET = ''

var handler = createHandler({ path: WEBHOOK_URL, secret:  WEBHOOK_SECRET})
var t = new Trello(TRELLO_KEY, TRELLO_TOKEN)

function initiator(request, response) {
  handler(request, response, function(err){
  });
}

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
