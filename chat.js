var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
var path = require('path');

app.listen(8080);

function handler (request, response) {
  var filePath = '.' + request.url;
    if (filePath == './')
      filePath = './index.htm';

    path.exists(filePath, function(exists) {

      if (exists) {
        fs.readFile(filePath, function(error, content) {
          if (error) {
            response.writeHead(500);
            response.end();
          }
          else {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(content, 'utf-8');
          }
        });
      }
      else {
        response.writeHead(404);
        response.end();
      }
    });
}


var MESSAGE_BACKLOG = 200;
var messages = [];


io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  
  socket.emit('message down', messages);
  
  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('message up', function(m){
    console.log('received', m);
    messages.push(m);
    while (messages.length > MESSAGE_BACKLOG)
      messages.shift();
    io.sockets.emit('message down', [m]);
  })

});
