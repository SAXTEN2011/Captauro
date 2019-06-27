var app = require('express')();
var http = require('http').createServer(app);

app.use(require('express').static("./"))

app.get('/', function(req, res){
  res.sendfile("./index.html")
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});