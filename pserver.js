// set up a server with express
var express = require('express');
var port = 5000;

var app = express();    //create our app with express
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// server-side game variables
var playerCount = 0;
var roomCount = 0;


var TEMP_ROOM_SIZE = 4;

// an array of sockets to each current client/player
// this should eliminate need for player ID
var playerArray = [];


// TODO: array of rooms, where each room is an array of 4 client sockets

// received a connection from a client
io.sockets.on('connection', function(client) 
{ 
	playerArray.push(client);
	client.emit('player_number', {ID: playerCount});
	playerCount++;
	console.log('server playercount incremented to:' + playerCount);
	if (playerCount === TEMP_ROOM_SIZE)
	{
		console.log("emitting full_room_achieved, players = " + TEMP_ROOM_SIZE);
		io.sockets.emit('full_room_achieved', {numPlayers: TEMP_ROOM_SIZE});
	}
	// console.log('server playercount incremented to:' + playerCount);
		
	// notify clients that a new player joined
	// var color = (playerCount % 2) ? "red" : "green"; // alternate between red/green players
	// io.sockets.emit('player_joined', {player_count: playerCount, player_color: color});

	// client moved and sent player data to server
	client.on('message_to_server', function(player)
	{ 
		// send this player's data to all other players
		// TODO: this will be restricted later to avoid excessive data transfers
		// io.sockets.emit('message_to_client', player);
		// if (playerCount === TEMP_ROOM_SIZE)
		// {
		// 	client.emit('full_room_achieved', {numPlayers: TEMP_ROOM_SIZE}); // redundant; but it succeeds to notifies the late joiner
		// }
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
