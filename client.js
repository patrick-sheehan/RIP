// connection port
// host: 10.201.145.60
// port: 8080

var socket = io.connect('http://insanitignis.com:8080');
//var socket = io.connect('http://localhost:8080');
var myClientId = null;
var num_clients = 9001;

socket.on('message', function(data) {

	if(myClientId != null) {
      log.warn('Another connection to server has been made!');
  }
  myClientId = socket.socket.sessionid;
  log.info('Connected to NodeJS with client id: ' + myClientId);
  
  $('#clientid').html(myClientId)
	console.log(data);
    //whenever something is passed through socket, this function will be triggered
});

socket.on('newGame', function(data){
  log.debug('Received data from server.');
   
});
/*
socket.on('numclients', function(data)
          {
          console.log(data);
          });*/
socket.on('roomData', function(data){
  log.debug('You are connected to room: ' + data.roomName)
  log.debug('Current players in room: ' + data.players)

  text = new Text(data.roomName, "20px Helvetica-Neue", "#FFF");
	text.x = 450;
	text.y = 380;
	
	stage.addChild(text);
});

socket.on('beginGame', function(data){  
  log.debug('beginGame');
});


socket.on('allClientsAndRoomsData', function(data){
   $('#players, #rooms').html('');
  for(var i in data) {
    if(i.length == 0) {
      $('#players').html("<br/>All clients: " + data[i].toString());
    } else {      
       $('#rooms').append('<br/>' + i + ': ');
       $('#rooms').append(data[i].toString());
    }
  }
});

socket.on('playerMove', function(data) {
 
});

socket.on('playerConnected', function(data) {
    var clientid = data.clientid; 
    log.debug('Player id: ' + clientid + ' has joined the game in room: ' + data.roomName);     
});

socket.on('playerDisconnected', function(data) {
 if(myClientId != data.clientid) {
   log.debug('Player id: ' + data.clientid + ' has left game from room: ' + data.roomName);
 }
});