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

var strokes = [] // current data (for new comers)


io.sockets.on('connection', function (socket) {
  
  // give the client a unique Id
  socket.clientId = "user" + i++ ; // user1, user2, ...
  
  // add the client to the pool
  clientCount++;
  
  // tell everyone that the new guy arrived
  socket.broadcast.emit('news', socket.clientId + ' has joined the fun and there are ' + clientCount + " of you now" );
  
  
  socket.on('set_url', function (data) {
    socket.url = data.url
    socket.join(socket.url)
    if(strokes[socket.url] == undefined){
      strokes[socket.url] = new Array()
    }
    // give the new guy the current strokes
    console.log("----------------------------------------------  Nouveau dans " + socket.url)    
    socket.emit('initDraw', strokes[socket.url]);
    
  
  })
  
  

  
  // listen to draw orders
  socket.on('drawThis', function (stroke) {
    
    if(stroke){
      
      // add the clientId in the stroke object
      stroke.clientId = socket.clientId;
      stroke.url = socket.url

      // broadcast the drawing to everyone
      // socket.broadcast.emit('draw',stroke);
      socket.broadcast.to(socket.url).emit('draw',stroke)
      
      // add the stroke to the stack of the room
      strokes[socket.url].push(stroke)
      
      console.log("------------------- on ajoute à " + socket.url)
      
    }
    
  })
  
  socket.on('clear', function () {
    
      strokes[socket.url] = new Array()
      io.sockets.in(socket.url).emit('initDraw', strokes[socket.url]);
      
  })
  
  
  socket.on('disconnect', function () {
    
      socket.broadcast.emit('news', socket.clientId + ' has disconnected');
      
      clientCount--;
      
      delete clients[socket.clientId];
      
  });
  
  
});