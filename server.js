//var io = require('socket.io').listen(65535);
//8080
var app = require('http').createServer(handler), io = require('socket.io').listen(app), fs = require('fs') app.listen(65535);


var clients = new Array();
var gsocket;
var rooms = new Array();

console.log('waiting for connection...');

io.sockets.on('connection', function(socket) {
	
	gsocket = socket;
	clients.push(socket.id);
	
	console.log('New client connected: ' + socket.id + ' total clients connected: ' + clients.length);
	
	
	setTimeout(sendInitialData, 1000);
	
	
	var roomName = null;
	
	for(var i = 0; i<rooms.length; i++)
	{
	var clientsInRoom = io.sockets.clients(rooms[i]);
    console.log(rooms[i] + ' connected clients: ' + clientsInRoom.length);

    	if(clientsInRoom.length < 2) {
      	roomName = rooms[i];
      	console.log('Joined ' + roomName)
      	break;
    	}
	} 
	
  if(roomName == null) {
    roomName = "Room " + (rooms.length + 1);
    rooms.push(roomName);
  }

  socket.roomName = roomName;
  socket.join(roomName);

  var clientsInRoom = io.sockets.clients(rooms[i]);
  if(clientsInRoom.length >= 2) {
     // maximum of 2 per room - if reached, create new room and re-init data
     io.sockets.in(roomName).emit('beginGame');
  }
  
  
  // broadcast room data
  io.sockets.in(roomName).emit('roomData', { roomName: roomName, players: io.sockets.manager.rooms['/' + roomName] });

  // inform everyone a new player has connected except the current socket
  socket.broadcast.emit('playerConnected', { clientid: socket.id, roomName : socket.roomName });

  // broadcast to all connected clients
  console.log(io.sockets.manager.rooms);
  io.sockets.emit('allClientsAndRoomsData', io.sockets.manager.rooms);

  // game updates broadcast to room only
  socket.on('playerMove', function(data){
    socket.broadcast.to(socket.roomName).emit('playerMove', data);
  });


  socket.on('disconnect', function () {
    // send a disconnected client message to notify all connected clients of a player disconnecting from the game
    io.sockets.emit('playerDisconnected', { clientid: socket.id, roomName: socket.roomName});
    // remove the disconnected client from our clients array
    for(var i = 0; i < clients.length; i++) {
      if(clients[i] == socket.id) {
        clients.splice(i, 1);
      }
    }

    console.log('Client disconnected: ' + socket.id + ' total clients connected: ' + clients.length);
  });
	socket.emit('message', "hello world");	
	
	socket.on('message', function(data) {
		socket.broadcast.emit('message', data);
	});
});

function sendInitialData() {
  gsocket.emit('newGame', { clients: clients} );
}