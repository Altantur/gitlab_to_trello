var createHandler = require('./gitlab-webhook-handler'),
    Trello = require('node-trello');

const TRELLO_KEY = '606e8e43f53447a2819dd630338306aa'
const WEBHOOK_URL = '/webhook'

var handler = null
var t = null

function setUp(trello, hashsecret) {
  handler = createHandler({ path: WEBHOOK_URL, secret:  hashsecret})
  t = new Trello(TRELLO_KEY, trello.token)
}

function webhookHandler(request, response) {

  handler(request, response, function(err){
    if(err) return console.log("Error folks!", err)
    console.log("no error so far");
  });
  handler.on('push', function (event) {
    console.log(JSON.stringify(event));
  })
  handler.on('error', function (err) {
    console.error('Error:', err.message)
  })

  handler.on('issue', function (event) {
    console.log(JSON.stringify(event));
  })

}

process.on('message', (message) => {
  switch (message.type) {
    case "webHooked":
    console.log("webhook called");
      webhookHandler(message.request, message.response)
      break;
    case "setUp":
      setUp(message.trello)
      break;
    default:

  }
})
// handler.on('note', function (event) {
// })
