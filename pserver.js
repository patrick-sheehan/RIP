var express = require('express');
var port = 5000;
var app = express();    //create our app with express
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var playerCount = 0;
var playerID = 0;
var roomCount = 0;

// TODO: add array of player IDs

io.sockets.on('connection', function(client) { // when client is connected

	playerCount++;
	playerID++;

	console.log('server playercount = ' + playerCount);
	
	io.sockets.emit('player_count', {player_count: playerCount}); // send player count to clients

	client.on('message_to_server', function(player){ // client sent player data to server
		
		if (player.ID === -1) {
			player.ID = playerID;
		}

		// Below testing that data was transferred properly
		// console.log("playerID = " + player.ID);	
		// console.log("player timestamp: " + player.timestamp);
		// console.log("player position: (" + player.x.toFixed(2) + ", " + player.y.toFixed(2) + ")");
		// console.log("player rotation: " + player.rotation);

		// Below sends message about each player to all other players
		// this will be restricted later to avoid excessive data transfers
		io.sockets.emit('message_to_client', player);

	});

	io.sockets.on('disconnect', function () {	// decrement player count upon disconnect
		// NOT TESTED
		playerCount--;
	});

});

app.configure(function() {
	app.use(express.static(__dirname)); //sets the static file location
	app.use(express.logger('dev')); //logs every request to the console
	app.use(express.cookieParser());
	app.use(express.bodyParser()); // pull information from html in POST
	app.use(express.methodOverride()); //simulate DELETE and PUT
	app.use(express.session({
		secret: 'pariscongobomie'
	}));
});

app.get('/', function(req, res){ 
  res.sendfile(__dirname + '/index.html');
});

server.listen(port, function() {
	console.log("App listening on port " + port);
});
