var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
var path = require('path');

app.listen(8080);

function handler (request, response) {
  var filePath = '.' + request.url;
    if (filePath == './')
      filePath = './index.html';

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

var clients = [];

var i = 0;

io.sockets.on('connection', function (socket) {
  
  // add the socket to the client pool
  clients.push( socket );
  
  socket.clientNumber = i++;
  socket.clientId = "user" + socket.clientNumber ; // user1, user2, ...
  
  io.sockets.emit('news', socket.clientId+' has joined the fun and there are ' + clients.length + " of you now" );
  
  socket.on('drawThis', function (data) {
    
    if(data.strokes && data.clientId){
      console.log( data.clientId + " drew " + data.strokes );
    }
      
    // tell everyone to draw this
    for(var j = 0, l = clients.length; j < l; j++){
      clients[j].emit('draw', data);
    }
    
  });
  
  socket.on('disconnect', function () {
      io.sockets.emit('news', socket.clientId + ' has disconnected');
  });
  
  
});