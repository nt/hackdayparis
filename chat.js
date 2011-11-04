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

var clients = {}; // pool of connected clients
var i = 0; // an index
var clientCount = 0; // number of clients still connected

var lastData = {}; // current data (for new comers)

io.sockets.on('connection', function (socket) {
  
  // give the client a unique Id
  socket.clientId = "user" + i++ ; // user1, user2, ...
  
  // add the client to the pool
  clients[socket.clientId] = socket;
  clientCount++;
  
  // tell everyone that the new guy arrived
  socket.broadcast.emit('news', socket.clientId + ' has joined the fun and there are ' + clientCount + " of you now" );
  
  // give the new guy the current strokes
  socket.emit('draw', lastData);
  
  // listen to draw orders
  socket.on('drawThis', function (data) {
    
    // log
    if(data.strokes && data.clientId){
      console.log( data.clientId + " drew something" );
    }
    
    // broadcast the drawing to everyone
    socket.broadcast.emit('draw',data);
    
    // save the current dataset
    lastData = data;
    
  });
  
  socket.on('disconnect', function () {
    
      socket.broadcast.emit('news', socket.clientId + ' has disconnected');
      
      clientCount--;
      
      delete clients[socket.clientId];
      
  });
  
  
});