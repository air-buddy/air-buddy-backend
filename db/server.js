var express = require('express');
var bodyParser = require('body-parser');
var controller = require('./controllers.js');
var db = require('./index.js');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.listen(3000, function () {
  console.log('listening on port 3000!');
});


app.get('/air-buddy', (req, res) => {
  // request format:
  // req query  {flight: UA100}
  controller.findAllSeatStatus(req.query, res)
})

app.post('/air-buddy', (req, res) => {
  // request format:
  // req.body = {flight: UA100,
  //  seat: 17A,
  //  likesToTalk: false}
  controller.saveSeatStatus(req.body, res);
})
