// set up a server with express
var express = require('express');
var port = 5000;

var app = express();    //create our app with express
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


// server-side game variables
var canvasHeight = 1;
var canvasWidth = 1;
var playerCount = 0;
var bulletCount = 0; 
var roomCount = 0;
var bulletSpeed = 5;

var TEMP_ROOM_SIZE = 2;

// an array of sockets to each current client/player
// this should eliminate need for player ID
var playerArray = [];
var bulletArray = [];

// TODO: array of rooms, where each room is an array of 4 client sockets


// received a connection from a client
io.sockets.on('connection', function(client) 
{ 
	playerArray.push(client);
	client.emit('player_number', {ID: playerCount});
	playerCount++;
 	console.log("server's count incremented to: " + playerCount);

	// if (playerCount === TEMP_ROOM_SIZE)
	// {
	// 	console.log("emitting full_room_achieved, players = " + TEMP_ROOM_SIZE);
	// 	io.sockets.emit('full_room_achieved', {numPlayers: TEMP_ROOM_SIZE});
	// }
	
	client.on('check_lobby_full', function()
	{ // let client know if the room is full yet
		if (playerCount === TEMP_ROOM_SIZE)
		{
			client.emit('full_room_achieved', {numPlayers: TEMP_ROOM_SIZE}); // redundant; but it succeeds to notifies the late joiner
		}
	});

	// a player moved and sent their data to the server
	client.on('message_to_server', function(player)
	{ 
		if (playerCount === TEMP_ROOM_SIZE)
		{
			client.emit('full_room_achieved', {numPlayers: TEMP_ROOM_SIZE}); // redundant; but it succeeds to notifies the late joiner
		}

		// send this player's data to all other players
		// TODO: restrict to avoid excessive data transfersds	
		io.sockets.emit('message_to_client', player, bulletArray);

	});
	client.on('move_bullets', function()
	{	// update position of all bullets
		moveBullets();
		io.sockets.emit('bullets_moved', bulletArray, bulletArray.length);
	});
	client.on('new_bullet', function(bullet)
	{ // add new bullet to the server-maintained array
		bulletArray.push(bullet);
		bulletCount++;
	});
	client.on('canvas_size', function(height, width)
	{	// set/expand canvas size (to delete out-of-bounds bullets)
		canvasHeight = (height > canvasHeight) ? height : canvasHeight;
		canvasWidth = (width > canvasWidth) ? width : canvasWidth;
	});
	// called when client disconnects. delete the socket.
	client.on('disconnect', function ()
	{	
		playerCount--;
		var i = playerArray.indexOf(client);
		delete playerArray[i];
		console.log('server playercount decremented to:' + playerCount);
		// TODO: client-side: handle when another player leaves
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


function moveBullets()
{ // update all bullet positions in the server-maintained array
	for(var i = 0; i < bulletArray.length; i++)
	{
		var b = bulletArray[i];

		b.image.x += Math.sin(b.angle*(Math.PI/-180)) * b.speed;
		b.image.y += Math.cos(b.angle*(Math.PI/-180)) * b.speed;

		// delete bullet from array when exceed canvas bounds
		if(bulletArray[i].x < 0 || bulletArray[i].x > canvasWidth || bulletArray[i].y < 0 || bulletArray[i].y > canvasHeight)
		{
			// TODO: remove this bullet from client side; currently only done on server array
			bulletArray.splice(i, 1);
		}
	}
}

