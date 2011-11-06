var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
var path = require('path');

var port = process.env.PORT || 8080;
app.listen(port);

io.configure(function () { // Polling due to heroku
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
})

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


var i = 0; // an index


// initialize the game
var game = {};
game.players = []; // list of players
game.playerCount = 0;

var gamesPlayed = 0;

game.newGame = function(drawer){
  game.currentWord = getRandomWord();
  game.strokes = [];
  game.currentDrawer = drawer;
  
  console.log("Call to newGame word="+game.currentWord+"and drawer="+drawer.playerName);
  
  
  // Start in 3...2...1. GO!
  
    
    io.sockets.emit('news', { action: 'msg', value: "Next game in 3....." });

     setTimeout(function(){
       io.sockets.emit('news', { action: 'msg', value: "Next game in 2....." });
     },1000);

     setTimeout(function(){
       io.sockets.emit('news', { action: 'msg', value: "Next game in 1....." });
     },2000);

     setTimeout(function(){
       io.sockets.emit('news', { action: 'msg', value: "Ready?" });
     },3000);
     
     
    gamesPlayed++;
    setTimeout(function(){
      
      console.log("STARTING A NEW GAME");
      
      
      // start the game for the users
      for(var k=0,l=game.players.length;k<l;k++){
        if(game.players[k]){
          
          if(game.players[k].clientId == game.currentDrawer.clientId){
            // it's the drawer, give him the word he has to draw
            game.players[k].emit('newGame',{word: game.currentWord});
            console.log("NewGame: warning the drawer "+game.players[k].playerName);
          }
          else{
            // it's a player, tell him who is the drawer
            game.players[k].emit('newGame',{clientId: game.currentDrawer.clientId, name: game.currentDrawer.playerName});
            console.log("NewGame: warning the player "+game.players[k].playerName);
          }
          
        }
      }
    },4000);
  
};

game.addPlayer = function(player){
  game.players.push(player);
  game.playerCount++;
};

var getRandomWord = function(){
  return "Rabbit";
};

game.removePlayer = function(playerId){
  for(var j=0,len=game.players.length;j<len;j++){
    if(game.players[j] && game.players[j].clientId == playerId){
      delete game.players[j];
      game.playerCount--;
      break;
    }
  }
};

game.getPlayers = function(){
  var players = [];
  
  for(var j=0,l=game.players.length;j<l;j++){
    
    if(game.players[j]){
      players.push({
        playerName: game.players[j].playerName,
        clientId: game.players[j].clientId
      });
    }
    
  }
  
  return players;
  
};

io.sockets.on('connection', function (socket) {
  
  // give the client a unique Id
  socket.clientId = "user" + i++ ; // user1, user2, ...
  
  // listen to when the player joins the game
  socket.on('joinGame', function(data, callback){
    
    socket.playerName = data.playerName;
    
    game.addPlayer(socket);
    
    // tell everyone that the new guy arrived
    socket.broadcast.emit('news', { clientId: socket.clientId,
                                    name: socket.playerName,
                                    action: 'joined' });
    
    // if the game has started, init the drawing for the new user
    callback({
      strokes: game.strokes,
      players: game.getPlayers(),
      currentDrawer: game.currentDrawer?{
        playerName: game.currentDrawer.playerName,
        clientId: game.currentDrawer.clientId
      }:{}
    });
    
    // start the game when the second player arrives
    if(game.playerCount == 2){
      
      console.log("There are two players, let's start");
      
      game.newGame(socket);
    }
    
  });
  
  // listen to drawers strokes
  socket.on('drawThis', function (stroke) {
    
    // make sure the player is the current drawer
    if(stroke && game.currentDrawer && game.currentDrawer.clientId == socket.clientId){
      
      // add the clientId in the stroke object
      stroke.clientId = socket.clientId;

      // broadcast the drawing to everyone
      socket.broadcast.emit('draw',stroke);

      // add the stroke to the stack
      game.strokes.push( stroke );
      
    }
    else{
      console.log("CHEAT: Received a stroke from someone that isn't the current drawer.");
    }
    
  });
  
  // listen to the clear order
  socket.on('clear', function(){
    // make sure the person who clears is the current drawer 
    if(game.currentDrawer && game.currentDrawer.clientId == socket.clientId){
      io.sockets.emit('clear');
    }
  });
  
  // listen to when a player emits a guess
  socket.on('guess', function(guess){
    
    // make sure it's not the drawer
    if(guess){
      if(game.currentWord && game.currentWord == guess && socket.clientId != game.currentDrawer.clientId){
        // YES GOOD GUESS
        // tell everyone about the guess
        io.sockets.emit('news', { clientId: socket.clientId,
                                        name: socket.playerName,
                                        action: 'found',
                                        value: guess });
        
        setTimeout ( "doSomething()", 5000 );
                                       
        // start a new game with the winner as drawer
        game.newGame(socket);
      }
      else{
        // tell everyone about the guess
        io.sockets.emit('news', { clientId: socket.clientId,
                                        name: socket.playerName,
                                        action: 'guess',
                                        value: guess });
      }                             
    }
    else{
      console.log("CHEAT: the current drawer tried to guess!!!");
    }
    
  });
  
  
  socket.on('disconnect', function () {
    
      socket.broadcast.emit('news', { clientId: socket.clientId,
                                      name: socket.playerName,
                                      action: 'quit'});
      
      game.removePlayer(socket.clientId);
      
      if(game.currentDrawer && socket.clientId == game.currentDrawer.clientId){
        // the drawer quit the game...
        
      }
      
      
  });
  
  
});