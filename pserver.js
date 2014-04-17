// set up a server with express
var express = require('express');
var port = 5000;

var app = express();    //create our app with express
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// server-side game variables
var playerCount = 0;
// var playerID = 0;
var roomCount = 0;

// an array of sockets to each current client/player
// this should eliminate need for player ID
var playerArray = [];


// TODO: array of rooms, where each room is an array of 4 client sockets

// received a 'connection' from a client
io.sockets.on('connection', function(client) 
{ 
	playerArray.push(client);
	playerCount++;

	console.log('server playercount incremented to:' + playerCount);

		
	// notify clients that a new player joined
	var color = (playerCount % 2) ? "red" : "green"; // alternate between red/green players
	io.sockets.emit('player_joined', {player_count: playerCount, player_color: color});

	// client moved and sent player data to server
	client.on('message_to_server', function(player)
	{ 
		// Below testing that data was transferred properly
		
		// console.log("timestamp: " + player.timestamp);
		// console.log("position: (" + player.x.toFixed(2) + ", " + player.y.toFixed(2) + ")");
		// console.log("rotation: " + player.rotation);
		

		// send this player's data to all other players
		// TODO: this will be restricted later to avoid excessive data transfers
		// io.sockets.emit('message_to_client', player);
	});

	// called when client disconnects. delete the socket.
	client.on('disconnect', function ()
	{	
		playerCount--;
		var i = playerArray.indexOf(client);
		delete playerArray[i];
		console.log('server playercount decremented to:' + playerCount);
		// io.sockets.emit('player_left', )
	});
});

app.configure(function() 
{
	app.use(express.static(__dirname)); //sets the static file location
	app.use(express.logger('dev')); //logs every request to the console
	app.use(express.cookieParser());
	app.use(express.bodyParser()); // pull information from html in POST
	app.use(express.methodOverride()); //simulate DELETE and PUT
	app.use(express.session( {secret: 'pariscongobomie'} ));
});

app.get('/', function(req, res)
{ 
  res.sendfile(__dirname + '/index.html');
});

server.listen(port, function() 
{
	console.log("App listening on port " + port);
});
