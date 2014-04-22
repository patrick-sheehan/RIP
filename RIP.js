var stage;
var player;
var enemy1;
var enemy2;
var enemy3;
var background;
var canvas;
var socket;
var gameActive = false;

var mode = "";	//either 2player or 4player

var playerText;
var enemy1Text;
var enemy2Text;
var enemy3Text;
var lobbyText;

// var ai;
// var AIMoveCounter = 0;				//counter to count ticks before changing move direction
// var AI_TICKS_TO_CHANGE = 40;			//number of ticks before AI changes move direction, lower numhber = more sporatic movement changes

var enemyList = [];

var upKey = 87;
var downKey = 83;
var leftKey = 65;
var rightKey = 68;

var upPressed;
var downPressed;
var leftPressed;
var rightPressed;
var mousePressed = false;

var movementSpeed = 5;
var currentBulletFireRate = 20;		//higher the rate, slower bullet shoots
var BULLET_FIRERATE_NORMAL = 20;
var BULLET_FIREREATE_POWERUP = 5;
var bulletFrameCounter = 0;
var bulletSpeed = 15;
var BULLET_DAMAGE = 20;				//damage each bullet does, player's health starts at 100
var RESPAWN_TIME = 5000;

//ALL_CAPS variables are final, do not modify their values in the code, only up here
var bulletArray = [];
var powerupExists = false;
var powerup;						//object
var playerPowerupTime = 0;			//time counter (in ticks) that player can have powerup
var MAX_POWERUP_TIME = 500;			//set time that player gets it
var removePlayerPowerup = false;	//so that on each tick it doesn't change image back
var POWERUP_ODDS = 500;				// "1/this" chance of powerup per tick
var TICKER_FPS = 60;			// originally 60

var numPlayersHere = 1;

var playerID;			// start from 0
var playerArray; 	// will include self as well as other opponents
var timestamp;
var healthTextArray = [];

/*
var manifest = [
	{id:"shoot", src:"audio/shoot.mp3", data:6},
	{id:"death", src:"audio/hey_listen", data:6}	
];
*/
document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;
document.getElementById( "gameCanvas" ).onmousedown = function(event){
    event.preventDefault();
};

function init()
{	// initialize client-side variables
	canvas = document.getElementById("gameCanvas");
	stage = new createjs.Stage(canvas);
	background = new createjs.Bitmap("images/backgrounds/grass-tiled.png");
	stage.addChild(background);
	createjs.Ticker.setFPS(TICKER_FPS);
	createjs.Ticker.addEventListener("tick", tick);
	stage.addEventListener("stagemousedown", mouseClick);
	stage.addEventListener("stagemouseup", mouseUnclick);
	

	//TEMPORARILY COMMENTED OUT, FOR DEBUGGING
	// var gameMode = confirm("OK = 2 player mode\n\nCancel = 4 player mode");
	// if(gameMode)
	// {
	// 	mode = "2player";
	// 	roomSize = 2;
	// }
	// else
	// {
	// 	mode = "4player";
	// 	roomSize = 4;
	// }

	startLobby();
	
	socket = io.connect("http://insanitignis.com:5000");	// connect to the server 

	socket.on('player_number', function(data)
	{
		playerID = data.ID;
	});
}

function tick(event)
{ // this function called many times per minute, more frequent when tab is active in browser
	
	if (gameActive)
	{ // the game has started

		player.image.toJSON = function()
		{	// TODO: move this function somewhere else? to when player is created?
			return { x: player.image.x, y: player.image.y, rotation: player.image.rotation };
		};

		var currTime = new Date().getTime();
		player.timestamp = currTime;

		// send this client's data to the server
		socket.emit('message_to_server', player);

		socket.on('data_to_client', function(players, bullets, healths)
		{	// server-side sends updated array of players, bullets, and player's healths
			updatePlayers(players, healths);
			updateBullets(bullets);
			updateHealthTexts(healths);
		});


		movePlayer();
		rotatePlayer();
		if(mousePressed)
			playerShoot();


// TODO: move this to server-side. server should decide when a powerup
		// 	is generated, then message the clients that it is there. The first
		//	player to get it makes it disappear and unavailable to others
		//
		// determinePowerup();

// TODO: move to server-side
		// checkPowerupCollision();

// TODO: handle client-side on disconnect
		// socket.on('disconnect', function(){});
	}
	else 	// if (!gameActive)
	{ // game has not started yet

		socket.emit('check_lobby_full');

		socket.on('full_room_achieved', function(room)
		{
			if (typeof playerArray == 'undefined')
			{
				playerArray = new Array();
				stage.removeChild(lobbyText);
				for (var i = 0; i < room.numPlayers; i++)
				{
					if (i == playerID)
					{	// initialize own player
						player = new Player(i);
						// player.playerID = playerID;
						playerArray[i] = player;
					}
					else
					{
						var p = new Player(i);
						playerArray[i] = p;
					}
				}
				socket.emit('canvas_size', canvas.height, canvas.width);
				gameActive = true;
				createTexts();
			}
		});

		// if(mode === "2player")// && playerNumber === 2)
		// {
		// 	gameActive = true;
		// 	stage.removeChild(lobbyText);
		// 	initialize2player();
		// }
			
		// else if(mode === "4player")// && playerNumber === 4)
		// {
		// 	gameActive = true;
		// 	stage.removeChild(lobbyText);
		// 	initialize4player();
		// }
	}
	stage.update();
}

function updateBullets(serverBullets)
{
	for (var i = 0; i < serverBullets.length; i++)
	{		
		var servBullet = serverBullets[i];

		if (typeof bulletArray[i] === 'undefined')
		{	// add new bullet to client array if needed
			var b = new Bullet(servBullet.timestamp, servBullet.speed, servBullet.image.x, 
										servBullet.image.y, servBullet.angle, servBullet.shooterID, servBullet.damagable);
			bulletArray[i] = b;
			stage.addChild(b.image);
		}
		else
		{	// if a bullet exists at this index
			var cliBullet = bulletArray[i];
			
			// update bullet ƒtion
			cliBullet.speed = servBullet.speed;

			if (cliBullet.speed == -1)
			{
				stage.removeChild(cliBullet.image);
				bulletArray.splice(i, 1);
			}
			else
			{
				cliBullet.image.x = servBullet.image.x;
				cliBullet.image.y = servBullet.image.y;
				cliBullet.angle = servBullet.angle;
				cliBullet.shooterID = servBullet.shooterID;
			}
		}
	}
}

function updatePlayers(players, healths)
{
	for (var i = 0; i < players.length; i++)
	{
		var newPlayer = players[i];
		var oldPlayer = playerArray[i];

		oldPlayer.isAlive = newPlayer.isAlive;

		if (!oldPlayer.isAlive)
		{
			if (healths[i] >= 100)
			{	// player has had health reset; respawn him
				oldPlayer.isAlive = true;
				stage.addChild(oldPlayer.image);
			}
			else
			{	// player is dead, ensure that not on the map
				stage.removeChild(oldPlayer.image);
			}
		}
		else if (i != playerID)
		{
			oldPlayer.image.rotation = newPlayer.image.rotation;
			oldPlayer.image.x = newPlayer.image.x;
			oldPlayer.image.y = newPlayer.image.y;
		}		
	}
}

function startLobby()
{ // start lobby for initial players waiting for others
	lobbyText = new createjs.Text("Waiting for players...", "bold 34px Comic Sans", "#ffffff");
	lobbyText.x = (canvas.width / 2) - 260;
	lobbyText.y = canvas.height / 2;
	stage.addChild(lobbyText);
}

function initialize2player()
{	// initialize two players (the enemy is a temporary placeholder)
	// player = new Player();
	// first = new Enemy();
	// enemyList.push(first);
	// createTexts(2);
	// stage.update();
}

function initialize4player()
{	// initialize four players (enemies is a temporary placeholder)
	// player = new Player();
	// first = new Enemy();
	// second = new Enemy();
	// third = new Enemy();
	// enemyList.push(first);
	// enemyList.push(second);
	// enemyList.push(third);
	// createTexts(4);
	// stage.update();
}

function createTexts()
{ // show texts to indicate health for each enemy

	playerText = new createjs.Text("Health: 100%", "bold 34px Comic Sans", "#ffffff");
	playerText.x = 10;
	playerText.y = 10;
	stage.addChild(playerText);
	playerText.color = "#ffffff";
	healthTextArray.push(playerText);

	enemy1Text = new createjs.Text("Health: 100%", "bold 34px Comic Sans", "#ffffff");
	enemy1Text.x = canvas.width - 350;
	enemy1Text.y = 10;
	stage.addChild(enemy1Text);
	healthTextArray.push(enemy1Text);

	if(playerArray.length == 4)
	{
		enemy2Text = new createjs.Text("Health: 100%", "bold 34px Comic Sans", "#ffffff");
		enemy2Text.x = 10;
		enemy2Text.y = canvas.height - 50;
		stage.addChild(enemy2Text);
		healthTextArray.push(enemy2Text);

		enemy3Text = new createjs.Text("Health: 100%", "bold 34px Comic Sans", "#ffffff");
		enemy3Text.x = canvas.width - 350;
		enemy3Text.y = canvas.height - 50;
		stage.addChild(enemy3Text);
		healthTextArray.push(enemy3Text);
	}
}

function Player(playerID)
{	// initialize a player
	// this.health = 100;

	this.deathTime = -1;
	this.isAlive = true;
	if (typeof playerID !== "undefined") { this.playerID = playerID; }
	else this.playerID = -1;

	// this.playerID = playerID
	var imageBitmap = "images/players/player_" + (playerID+1) + ".png";
	this.image = new createjs.Bitmap(imageBitmap);

	this.image.x = Math.random()*canvas.width;
	this.image.y = Math.random()*canvas.height;
	this.image.rotation = 0;
	//set registration points to center of image
	this.image.regX = 50;
	this.image.regY = 50;
	stage.addChild(this.image);
}

function Enemy()
{ // initialize a placeholder enemy
	// this.health = 100;
	// // TODO: identify picture with a variable (ie red/blue/green)
	// this.image = new createjs.Bitmap("images/players/player_1.png");
	// this.image.x = Math.random()*canvas.width;
	// this.image.y = Math.random()*canvas.height;
	// //set registration points to center of image
	// this.image.regX = 50;
	// this.image.regY = 50;
	// this.moveDirection = 0;
	// stage.addChild(this.image);
}

function Bullet(timestamp, speed, x, y, angle, shooterID, damagable)
{ // initialize a bullet, these will be stored in an array and passed to the server
	// all parameters are optional. Used when creating a new bullet created by another client
	
	if (typeof timestamp !== "undefined") { this.timestamp = timestamp; }
	else 
	{ 
		var currTime = new Date().getTime();
		this.timestamp = currTime; 
	}

	if (typeof damagable !== "undefined") { this.damagable = damagable; }
	else { this.damagable = true; }

	if (typeof speed !== "undefined") { this.speed = speed; }
	else { this.speed = bulletSpeed; }

	this.image = new createjs.Bitmap("images/objects/bullet.png");
	this.image.regX = 2;
	this.image.regY = 2;

	if (typeof x !== "undefined") { this.image.x = x; }
	else { this.image.x = player.image.x; }

	if (typeof y !== "undefined") { this.image.y = y; }
	else { this.image.y = player.image.y; }
	
	this.initialX = this.image.x;
	this.initialY = this.image.y;

	if (typeof angle !== "undefined") { this.angle = angle; }
	else { this.angle = player.image.rotation; }

	if (typeof shooterID !== "undefined") { this.shooterID = shooterID; }
	else { this.shooterID = playerID; }

	var mouseX = stage.mouseX;
	var mouseY = stage.mouseY;
	this.angle = (Math.atan2(mouseY - this.image.y, mouseX - this.image.x)* (180/Math.PI)) - 90;

}

function Powerup()
{
	this.image = new createjs.Bitmap("images/effects/double_tap_resize.png");
	this.image.regX = 23;
	this.image.regY = 23;
	this.image.x = canvas.width / 2;
	this.image.y = canvas.height / 2;

	stage.addChild(this.image);
}

function PowerDown()
{
	this.image = new createjs.Bitmap("image/backgrounds/grass_frozen.png");
	this.image.regX = 30;
	this.image.regY = 30;
	this.image.x = canvas.width / 3;
	this.image.y = canvas.height / 3;

	stage.addChild(this.image);
}

function PowerDownIndicator()
{
	this.image = new createjs.Bitmap("image/players/player_3.png");
	this.image.regX = 30;
	this.image.regY = 30;
	this.image.x = player.image.x;
	this.image.y = player.image.y;

	stage.addChild(this.image);
}

function PowerupIndicator()
{
	this.image = new createjs.Bitmap("images/effects/powerupBlueRing.png");
	this.image.regX = 50;
	this.image.regY = 50;
	this.image.x = player.image.x;
	this.image.y = player.image.y;
	
	stage.addChild(this.image);
}

function movePlayer()
{	//doing each combination, as if you detect them separately then the player moves sqrt(2) as fast on diagonals
	if(upPressed && leftPressed)
	{
		player.image.y -= movementSpeed / 1.4;
		player.image.x -= movementSpeed / 1.4;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.y -= movementSpeed / 1.4;
			powerRing.image.x -= movementSpeed / 1.4;
		}
		
	}
	else if(upPressed && rightPressed)
	{
		player.image.y -= movementSpeed / 1.4;
		player.image.x += movementSpeed / 1.4;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.y -= movementSpeed / 1.4;
			powerRing.image.x += movementSpeed / 1.4;
		}
	}
	else if(rightPressed && downPressed)
	{
		player.image.x += movementSpeed / 1.4;
		player.image.y += movementSpeed / 1.4;
		if (playerPowerupTime > 0)
		{
			powerRing.image.x += movementSpeed / 1.4;
			powerRing.image.y += movementSpeed / 1.4;
		}
	}
	else if(leftPressed && downPressed)
	{
		player.image.x -= movementSpeed / 1.4;
		player.image.y += movementSpeed / 1.4;
		if (playerPowerupTime > 0)
		{		
			powerRing.image.x -= movementSpeed / 1.4;
			powerRing.image.y += movementSpeed / 1.4;
		}
	}
	else if(upPressed)
	{
		player.image.y -= movementSpeed;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.y -= movementSpeed;
		}
	}
	else if(downPressed)
	{
		player.image.y += movementSpeed;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.y += movementSpeed;
		}
	}
	else if(leftPressed)
	{
		player.image.x -= movementSpeed;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.x -= movementSpeed;
		}
	}
	else if(rightPressed)
	{
		player.image.x += movementSpeed;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.x += movementSpeed;
		}
	}

	var threshhold = 50;	//player boundaries
	if(player.image.x - threshhold < 0)
	{
		player.image.x = threshhold;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.x = threshhold;
		}
	}
	if(player.image.y - threshhold < 0)
	{
		player.image.y = threshhold;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.y = threshhold;
		}
	}
	if(player.image.x + threshhold  > canvas.width)
	{
		player.image.x = canvas.width - threshhold;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.x = canvas.width - threshhold;
		}
	}
	if(player.image.y + threshhold > canvas.height)
	{
		player.image.y = canvas.height - threshhold;
		
		if (playerPowerupTime > 0)
		{
			powerRing.image.y = canvas.height - threshhold;
		}
	}
}

//using AIMoveCounter and AI_TICKS_TO_CHANGE
function moveEnemies()
{
	// //new move direction
	// if(AIMoveCounter == 0)
	// {
		// //0-7
		// ai.moveDirection = Math.floor(Math.random()*8);
		// AIMoveCounter++;
	// }
	// else if(AIMoveCounter >= AI_TICKS_TO_CHANGE)
	// {
		// AIMoveCounter = 0;
	// }
	// else
	// {
		// AIMoveCounter++;
	// }

	// switch(ai.moveDirection)
	// {
		// case 0:
			// ai.image.x += movementSpeed;
			// break;
		// case 1:
			// ai.image.x -= movementSpeed;
			// break;
		// case 2:
			// ai.image.y += movementSpeed;
			// break;
		// case 3:
			// ai.image.y -= movementSpeed;
			// break;
		// case 4:
			// ai.image.x += movementSpeed / 1.4;
			// ai.image.y += movementSpeed / 1.4;
			// break;
		// case 5:
			// ai.image.x -= movementSpeed / 1.4;
			// ai.image.y -= movementSpeed / 1.4;
			// break;
		// case 6:
			// ai.image.x += movementSpeed / 1.4;
			// ai.image.y -= movementSpeed / 1.4;
			// break;
		// default:
			// ai.image.x -= movementSpeed / 1.4;
			// ai.image.y += movementSpeed / 1.4;
	// }

	// var threshhold = 50;
	// if(ai.image.x - threshhold < 0)
	// {
		// ai.image.x = threshhold;
		// AIMoveCounter = 0;
	// }
	// if(ai.image.y - threshhold < 0)
	// {
		// ai.image.y = threshhold;
		// AIMoveCounter = 0;
	// }
	// if(ai.image.x + threshhold  > canvas.width)
	// {
		// ai.image.x = canvas.width - threshhold;
		// AIMoveCounter = 0;
	// }
	// if(ai.image.y + threshhold > canvas.height)
	// {
		// ai.image.y = canvas.height - threshhold;
		// AIMoveCounter = 0;
	// }
}

function moveBullets()
{ // move the bullets
	for(var i = 0; i < bulletArray.length; i++)
	{
		bulletArray[i].image.x += Math.sin(bulletArray[i].angle*(Math.PI/-180)) * bulletSpeed;
		bulletArray[i].image.y += Math.cos(bulletArray[i].angle*(Math.PI/-180)) * bulletSpeed;
		bulletArray[i].initialX = bulletArray[i].image.x;
		bulletArray[i].initialY = bulletArray[i].image.y;

		//TODO: this is to prevent memory leak with bullets travelling off the canvas indefinitely, currently causes bug where
		//bullet completely stops
		if(bulletArray[i].image.x < 0 || bulletArray[i].image.x > canvas.width || bulletArray[i].image.y < 0 || bulletArray[i].image.y > canvas.height)
		{
			var thisBullet = bulletArray[i];
			//delete thisBullet;
			//bulletArray = bulletArray.slice(i);
		}
	}

}

function rotatePlayer()
{ // rotate the player
	var mouseX = stage.mouseX;
	var mouseY = stage.mouseY;
	var rotationAngle = Math.atan2(mouseY - player.image.y, mouseX - player.image.x);
	player.image.rotation = rotationAngle * (180/Math.PI);
}

function playerShoot()
{ // player shot a bullet
	createjs.Sound.play("shoot", createjs.Sound.INTERUPT_LATE);
	if(bulletFrameCounter == 0)
	{
		// create a bullet and send it's data to server
		var bullet = new Bullet();
		// bulletArray.push(bullet);

		bullet.image.toJSON = function()
		{
			return {x: bullet.image.x, y: bullet.image.y};
		}
		socket.emit('new_bullet', bullet);
	}
	bulletFrameCounter++;
	if(bulletFrameCounter > currentBulletFireRate)
	{
		bulletFrameCounter = 0;
	}
}

function determinePowerup()
{
	//1/2000 chance per tick for powerup
	if(!powerupExists && (Math.floor(Math.random()*POWERUP_ODDS) == 0))
	{
		powerupExists = true;
		powerup = new Powerup();
	}

	if(playerPowerupTime > 0)
	{
		playerPowerupTime --;
	}
	if (playerPowerupTime == 0 && removePlayerPowerup)		//player powerup time is over
	{
		var originalX = player.image.x;
		var originalY = player.image.y;

		removePlayerPowerup = false;
		
		//stage.removeChild(player.image);
		//player.image = new createjs.Bitmap("images/players/player_1.png");
		//player.image.regX = 50;
		//player.image.regY = 50;
		//player.image.x = originalX;
		//player.image.y = originalY;
		//stage.addChild(player.image);

		stage.removeChild(powerRing.image);
		
		
		currentBulletFireRate = BULLET_FIRERATE_NORMAL;
	}
}

function determinePowerDown()
{
	// 1/2000 chance per tick for powerup *LIES!*
		powerup = new Powerup();
// TODO: Replace with a "while on" instead of a "countdown"
	if(playerPowerupTime > 0)
	{
		playerPowerupTime --;
	}
// TODO: Replace with a "if off" instead of "powerup time is over"
	if (playerPowerupTime == 0 && removePlayerPowerup)		//player powerup time is over
	{
		var originalX = player.image.x;
		var originalY = player.image.y;

		removePlayerPowerup = false;
		
		//stage.removeChild(player.image);
		//player.image = new createjs.Bitmap("images/players/player_1.png");
		//player.image.regX = 50;
		//player.image.regY = 50;
		//player.image.x = originalX;
		//player.image.y = originalY;
		//stage.addChild(player.image);

		stage.removeChild(powerRing.image);
		
		
		currentBulletFireRate = BULLET_FIRERATE_NORMAL;
	}
}

function checkEnemyBulletCollision()
{ // check if any bullets hit the enemy and update his health
	var threshhold = 30;
	for(var j = 0; j < enemyList.length; j++)
	{
		for(var i = 0; i < bulletArray.length; i++)
		{
			if(enemyList[j].health > 0 &&
				bulletArray[i].image.x > enemyList[j].image.x - threshhold &&
				bulletArray[i].image.x < enemyList[j].image.x + threshhold &&
				bulletArray[i].image.y > enemyList[j].image.y - threshhold &&
				bulletArray[i].image.y < enemyList[j].image.y + threshhold &&
				bulletArray[i].damagable)
			{
				console.log("bullet collision");
				bulletArray[i].damagable = false;
				stage.removeChild(bulletArray[i].image);
				bulletArray.slice(i);
				enemyList[j].health -= BULLET_DAMAGE;
				if(enemyList[j].health <= 0)
				{
					stage.removeChild(enemyList[j].image);
					//var newEnemy = new Enemy();
					//enemyList.push(newEnemy);
				}
			}


			// bulletArray[i].image.x += Math.sin(bulletArray[i].angle*(Math.PI/-180)) * bulletSpeed;
			// bulletArray[i].image.y += Math.cos(bulletArray[i].angle*(Math.PI/-180)) * bulletSpeed;
			// bulletArray[i].initialX = bulletArray[i].image.x;
			// bulletArray[i].initialY = bulletArray[i].image.y;

			// //TODO: this is to prevent memory leak with bullets travelling off the canvas indefinitely, currently causes bug where
			// //bullet completely stops
			// if(bulletArray[i].image.x < 0 || bulletArray[i].image.x > canvas.width || bulletArray[i].image.y < 0 || bulletArray[i].image.y > canvas.height)
			// {
			// 	var thisBullet = bulletArray[i];
			// 	//delete thisBullet;
			// 	//bulletArray = bulletArray.slice(i);
			// }
		}
	}
}

function checkPowerupCollision()
{
	var threshhold = 30; 	//# of pixels from center of player to powerup boundaries
	if(powerupExists && playerPowerupTime == 0)
	{
		if((player.image.x + threshhold) > (powerup.image.x - 23) && (player.image.x - threshhold) < (powerup.image.x + 23)
			&& (player.image.y + threshhold) > (powerup.image.y - 23) && (player.image.y - threshhold) < (powerup.image.y + 23))
		{
			var originalX = player.image.x;
			var originalY = player.image.y;

			powerRing = new PowerupIndicator();
			
			/*
			stage.removeChild(player.image);
			player.image = new createjs.Bitmap("images/effects/playerWithPowerup.png");
			player.image.regX = 50;
			player.image.regY = 50;
			player.image.x = originalX;
			player.image.y = originalY;
			stage.addChild(player.image);
			*/
			
			stage.removeChild(powerup.image);
			
			
			powerupExists = false;
			removePlayerPowerup = true;
			playerPowerupTime = MAX_POWERUP_TIME;
			currentBulletFireRate = BULLET_FIREREATE_POWERUP;
		}
	}
}

function checkPowerDownCollision()
{
	var threshhold = 30; 	//# of pixels from center of player to powerup boundaries
	//if(powerupExists && playerPowerupTime == 0)
	//{
		if((player.image.x + threshhold) > (powerup.image.x - 23) && (player.image.x - threshhold) < (powerup.image.x + 23)
			&& (player.image.y + threshhold) > (powerup.image.y - 23) && (player.image.y - threshhold) < (powerup.image.y + 23))
		{
			var originalX = player.image.x;
			var originalY = player.image.y;

			powerRing = new PowerupIndicator();
			
			/*
			stage.removeChild(player.image);
			player.image = new createjs.Bitmap("images/effects/playerWithPowerup.png");
			player.image.regX = 50;
			player.image.regY = 50;
			player.image.x = originalX;
			player.image.y = originalY;
			stage.addChild(player.image);
			*/
			
			stage.removeChild(powerup.image);
			
			
			powerupExists = false;
			removePlayerPowerup = true;
			playerPowerupTime = MAX_POWERUP_TIME;
			currentBulletFireRate = BULLET_FIREREATE_POWERUP;
		}
//	}
}

function updateHealthTexts(healths)
{ // update the texts that indicate players' healths
	// playerText.text = "Your Health: " + player.health + "%";
	// enemy1Text.text = "Enemy 1 Health: " + enemyList[0].health + "%";

	for (var i = 0; i < healths.length; i ++)
	{
		var thisPlayer = playerArray[i];
		var h = healths[i];
		var healthText = healthTextArray[i];
		healthText.color = "#ffffff";
		

		if (h <= 0) stage.removeChild(healthText);
		else if(h >= 100) 
		{
			healthText.color = "#ffffff";
			stage.addChild(healthText);
		}
		else if(h > 80) healthText.color = "#ffcccc";
		else if(h > 60) healthText.color = "#ff9999";
		else if(h > 40) healthText.color = "#ff6666";
		else if(h > 20) healthText.color = "#ff3333";
		else if(h > 0) healthText.color = "#ff0000";

		if (player.playerID == i)
		{
			healthText.text = "Your Health: " + h + "%";
		}
		else
		{
			healthText.text = "Enemy " + (i + 1) + " Health: " + h + "%";
		}
	}


	// if(player.health >= 100)
	// 	playerText.color = "#ffffff";
	// else if(player.health > 80)
	// 	playerText.color = "#ffcccc";
	// else if(player.health > 60)
	// 	playerText.color = "#ff9999";
	// else if(player.health > 40)
	// 	playerText.color = "#ff6666";
	// else if(player.health > 20)
	// 	playerText.color = "#ff3333";
	// else
	// 	playerText.color = "#ff0000";

	// if(enemyList[0].health >= 100)
	// 	enemy1Text.color = "#ffffff";
	// else if(enemyList[0].health > 80)
	// 	enemy1Text.color = "#ffcccc";
	// else if(enemyList[0].health > 60)
	// 	enemy1Text.color = "#ff9999";
	// else if(enemyList[0].health > 40)
	// 	enemy1Text.color = "#ff6666";
	// else if(enemyList[0].health > 20)
	// 	enemy1Text.color = "#ff3333";
	// else
	// 	enemy1Text.color = "#ff0000";
		
	// if(mode == "4player")
	// {
	// 	enemy2Text.text = "Enemy 2 Health: " + enemyList[1].health + "%";
	// 	enemy3Text.text = "Enemy 3 Health: " + enemyList[2].health + "%";
		
	// 	if(enemyList[1].health >= 100)
	// 		enemy2Text.color = "#ffffff";
	// 	else if(enemyList[1].health > 80)
	// 		enemy2Text.color = "#ffcccc";
	// 	else if(enemyList[1].health > 60)
	// 		enemy2Text.color = "#ff9999";
	// 	else if(enemyList[1].health > 40)
	// 		enemy2Text.color = "#ff6666";
	// 	else if(enemyList[1].health > 20)
	// 		enemy2Text.color = "#ff3333";
	// 	else
	// 		enemy2Text.color = "#ff0000";
			
	// 	if(enemyList[2].health >= 100)
	// 		enemy3Text.color = "#ffffff";
	// 	else if(enemyList[2].health > 80)
	// 		enemy3Text.color = "#ffcccc";
	// 	else if(enemyList[2].health > 60)
	// 		enemy3Text.color = "#ff9999";
	// 	else if(enemyList[2].health > 40)
	// 		enemy3Text.color = "#ff6666";
	// 	else if(enemyList[2].health > 20)
	// 		enemy3Text.color = "#ff3333";
	// 	else
	// 		enemy3Text.color = "#ff0000";
	// }
}

function mouseClick(canvas, e)
{
	mousePressed = true;
	
	// ???
	// e.preventDefault();
}

function mouseUnclick(e)
{
	mousePressed = false;
}


//allow for WASD and arrow control scheme
function handleKeyDown(e) {
	//cross browser issues exist
	if(!e){ var e = window.event; }
	switch(e.keyCode) {
		case upKey:		upPressed = true; return false;
		case downKey:	downPressed = true; return false;
		case leftKey:	leftPressed = true; return false;
		case rightKey:	rightPressed = true; return false;
	}
}

//allow for WASD and arrow control scheme
function handleKeyUp(e) {
	//cross browser issues exist
	if(!e){ var e = window.event; }
	switch(e.keyCode) {
		case upKey:		upPressed = false; break;
		case downKey:	downPressed = false; break;
		case leftKey:	leftPressed = false; break;
		case rightKey:	rightPressed = false; break;
	}
}