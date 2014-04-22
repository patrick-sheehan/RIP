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

var BULLET_DAMAGE = 20;				//damage each bullet does. player's health starts at 100
var BULLET_THRESHHOLD = 30;
var TEMP_ROOM_SIZE = 4;

// an array of sockets to each current client/player
// this should eliminate need for player ID
var socketArray = [];
var playerArray = [];
var healthArray = [];
var bulletArray = [];

// TODO: array of rooms, where each room is an array of 4 client sockets


// received a connection from a client
io.sockets.on('connection', function(client) 
{ 
	socketArray.push(client);
	client.emit('player_number', {ID: playerCount});
	playerCount++;
	healthArray.push(100);
 	console.log("server's count incremented to: " + playerCount);

	client.on('check_lobby_full', function()
	{ // let client know if the room is full yet
		if (playerCount === TEMP_ROOM_SIZE)
		{
			client.emit('full_room_achieved', {numPlayers: TEMP_ROOM_SIZE}); // redundant; but it succeeds to notifies the late joiner
		}
	});

	client.on('canvas_size', function(height, width)
	{	// set/expand canvas size (to delete out-of-bounds bullets)
		canvasHeight = (height > canvasHeight) ? height : canvasHeight;
		canvasWidth = (width > canvasWidth) ? width : canvasWidth;
	});

	// a player moved and sent their data to the server
	client.on('message_to_server', function(player)
	{ // send this player's data to all other players
		// TODO: restrict to avoid excessive data transfers

		playerArray[player.playerID] = player;
		
		moveBullets();
		checkBulletCollision();

		io.sockets.emit('data_to_client', playerArray, bulletArray, healthArray);
	});

	client.on('new_bullet', function(bullet)
	{ // add new bullet to the server-maintained array
		bulletArray.push(bullet);
		bulletCount++;
	});

	client.on('disconnect', function ()
	{	// called when client disconnects. delete the socket.
		playerCount--;
		var i = socketArray.indexOf(client);
		delete socketArray[i];
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

		if (b.speed == -1)
		{	// this bullet was flagged last message, remove it now
			bulletArray.splice(i, 1);
		}
		b.image.x += Math.sin(b.angle*(Math.PI/-180)) * b.speed;
		b.image.y += Math.cos(b.angle*(Math.PI/-180)) * b.speed;

		// delete bullet from array when exceed canvas bounds
		if(b.image.x < 0 || b.image.x > canvasWidth || b.image.y < 0 || b.image.y > canvasHeight)
		{
			// flag this bullet that is now out of range
			// server-side: remove it next time this function is called
			// client-side: remove this bullet's image from stage
			b.speed = -1;
		}
	}
}

function checkBulletCollision()
{ // check if any bullets hit the enemy and update his health
	var threshhold = 30;
	for(var j = 0; j < playerArray.length; j++)
	{
		for(var i = 0; i < bulletArray.length; i++)
		{
			var player = playerArray[j]
			var bullet = bulletArray[i];
			if(healthArray[i] > 0 && bullet.damagable &&
				bullet.shooterID != player.playerID &&
				bullet.image.x > player.image.x - threshhold &&
				bullet.image.x < player.image.x + threshhold &&
				bullet.image.y > player.image.y - threshhold &&
				bullet.image.y < player.image.y + threshhold)
			{
				console.log("bullet collision");
				bullet.damagable = false;
				bullet.speed = -1;
				healthArray[j] -= BULLET_DAMAGE;
				// player.health -= BULLET_DAMAGE;
			}
		}
	}
}

// function checkBulletCollision(player)
// { // check if any bullets hit the enemy and update his health
// 	// var playerIndex = playerArray.indexOf(playerID);
// 	// var p = playerArray[playerIndex];

// 	var totalDamage = 0;

// 	for(var i = 0; i < bulletArray.length; i++)
// 	{
// 		var bullet = bulletArray[i];
// 		if(player.health > 0 && bullet.damagable && 
// 				bullet.shooterID != player.playerID &&
// 				bullet.image.x > player.image.x - BULLET_THRESHHOLD &&
// 				bullet.image.x < player.image.x + BULLET_THRESHHOLD &&
// 				bullet.image.y > player.image.y - BULLET_THRESHHOLD &&
// 				bullet.image.y < player.image.y + BULLET_THRESHHOLD)
// 		{
// 			bullet.damagable = false;

// 			// flag this one so it will be removed later in server's moveBullets() and client's updateBullets()
// 			bullet.speed = -1;	

// 			totalDamage += BULLET_DAMAGE;
// 		}
// 	}
// 	return totalDamage;
// }
