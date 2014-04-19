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

//Hard code for debugging
	// player = new Player();
	// console.log("numEnemies = " + enemyList.length);
//End hard code

	startLobby();
	
	socket = io.connect("http://localhost:5000");	// connect to the server 

	socket.on('player_number', function(data)
	{
		playerID = data.ID;
	});
}

function tick(event)
{ // this function called many times per minute, more frequent when tab is active in browser
	
	if (gameActive)
	{ // this block is executed for every tick() function call once the game has started

		// send this client's data to the server
		
		player.playerID = playerID;
		player.image.toJSON = function()
		{
			return { x: player.image.x, y: player.image.y, rotation: player.image.rotation };
		};
		var currTime = new Date().getTime();
		player.timestamp = currTime;
		socket.emit('message_to_server', player);

		socket.on('data_to_client', function(player_data, bullets)
		{	// the playerArray now has old data for this player, 
			// update it with the newer 'player_data' that was passed
			if (player_data.playerID != undefined && player_data.playerID != playerID)
			{
				updatePlayer(playerArray[player_data.playerID], player_data);
			}
			updateBullets(bullets);
		});

		movePlayer();
		rotatePlayer();
		if(mousePressed)
			playerShoot();

		// moveBullets();
		socket.emit('move_bullets');


		// determinePowerup();
		// moveEnemies();
		// checkEnemyBulletCollision();
		// checkPowerupCollision();
		// updateHealthTexts();

		// socket.on('disconnect', function(){});
	}
	else 	// if (!gameActive)
	{ // conditional when players are in the lobby

		// could request exact number from server, but probably costly
		// lobbyText.text = "Waiting for " + roomSize + " total players"; 
		
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
						player = new Player();
						playerArray[i] = player;
					}
					else
					{
						var p = new Player();
						playerArray[i] = p;
					}
				}
				socket.emit('canvas_size', canvas.height, canvas.width);
				gameActive = true;
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
			// alert("adding new bullet at i = " + i + " bullArr.len = " + bulletArray.length);
			var b = new Bullet(servBullet.timestamp, servBullet.speed, servBullet.image.x, servBullet.image.y, servBullet.angle);
			bulletArray[i] = b;
			stage.addChild(b.image);
		}
		else
		{	// if a bullet exists at this index
			var cliBullet = bulletArray[i];
			
			// update bullet location
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
			}
		}
	}
}
function updatePlayer(this_player, newData)
{
	this_player.health = newData.health;
	this_player.image.rotation = newData.image.rotation;
	this_player.image.x = newData.image.x;
	this_player.image.y = newData.image.y;
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
	player = new Player();
	first = new Enemy();
	enemyList.push(first);
	createTexts(2);
	stage.update();
}

function initialize4player()
{	// initialize four players (enemies is a temporary placeholder)
	player = new Player();
	first = new Enemy();
	second = new Enemy();
	third = new Enemy();
	enemyList.push(first);
	enemyList.push(second);
	enemyList.push(third);
	createTexts(4);
	stage.update();
}

function createTexts(numPlayers)
{ // show texts to indicate health for each enemy
	playerText = new createjs.Text("Your Health: 100%", "bold 34px Comic Sans", "#ffffff");
	enemy1Text = new createjs.Text("Enemy 1 Health: 100%", "bold 34px Comic Sans", "#ffffff");
	playerText.x = 10;
	playerText.y = 10;
	enemy1Text.x = canvas.width - 350;
	enemy1Text.y = 10;

	stage.addChild(playerText);
	stage.addChild(enemy1Text);
	
	if(numPlayers == 4)
	{
		enemy2Text = new createjs.Text("Enemy 2 Health: 100%", "bold 34px Comic Sans", "#ffffff");
		enemy3Text = new createjs.Text("Enemy 3 Health: 100%", "bold 34px Comic Sans", "#ffffff");
		enemy2Text.x = 10;
		enemy2Text.y = canvas.height - 50;
		enemy3Text.x = canvas.width - 350;
		enemy3Text.y = canvas.height - 50;
		stage.addChild(enemy2Text);
		stage.addChild(enemy3Text);
	}
}

function Player()
{	// initialize a player
	this.health = 100;
	this.image = new createjs.Bitmap("images/players/player_1.png");
	this.image.x = Math.random()*canvas.width;
	this.image.y = Math.random()*canvas.height;
	//set registration points to center of image
	this.image.regX = 50;
	this.image.regY = 50;
	stage.addChild(this.image);
}

function Enemy()
{ // initialize a placeholder enemy
	this.health = 100;
	// TODO: identify picture with a variable (ie red/blue/green)
	this.image = new createjs.Bitmap("images/players/player_1.png");
	this.image.x = Math.random()*canvas.width;
	this.image.y = Math.random()*canvas.height;
	//set registration points to center of image
	this.image.regX = 50;
	this.image.regY = 50;
	this.moveDirection = 0;
	stage.addChild(this.image);
}

function Bullet(timestamp, speed, x, y, angle)
{ // initialize a bullet, these will be stored in an array and passed to the server
	// all parameters are optional. Used when creating a new bullet created by another client
	
	if (typeof timestamp !== "undefined") { this.timestamp = timestamp; }
	else 
	{ 
			var currTime = new Date().getTime();
			this.timestamp = currTime; 
	}


	this.damagable = true;
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


	var mouseX = stage.mouseX;
	var mouseY = stage.mouseY;
	this.angle = (Math.atan2(mouseY - this.image.y, mouseX - this.image.x)* (180/Math.PI)) - 90;

	//console.log("bullet count: " + bulletArray.length);
	// stage.addChild(this.image);
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

function updateHealthTexts()
{ // update the texts that indicate players' healths
	playerText.text = "Your Health: " + player.health + "%";
	enemy1Text.text = "Enemy 1 Health: " + enemyList[0].health + "%";

	if(player.health >= 100)
		playerText.color = "#ffffff";
	else if(player.health > 80)
		playerText.color = "#ffcccc";
	else if(player.health > 60)
		playerText.color = "#ff9999";
	else if(player.health > 40)
		playerText.color = "#ff6666";
	else if(player.health > 20)
		playerText.color = "#ff3333";
	else
		playerText.color = "#ff0000";

	if(enemyList[0].health >= 100)
		enemy1Text.color = "#ffffff";
	else if(enemyList[0].health > 80)
		enemy1Text.color = "#ffcccc";
	else if(enemyList[0].health > 60)
		enemy1Text.color = "#ff9999";
	else if(enemyList[0].health > 40)
		enemy1Text.color = "#ff6666";
	else if(enemyList[0].health > 20)
		enemy1Text.color = "#ff3333";
	else
		enemy1Text.color = "#ff0000";
		
	if(mode == "4player")
	{
		enemy2Text.text = "Enemy 2 Health: " + enemyList[1].health + "%";
		enemy3Text.text = "Enemy 3 Health: " + enemyList[2].health + "%";
		
		if(enemyList[1].health >= 100)
			enemy2Text.color = "#ffffff";
		else if(enemyList[1].health > 80)
			enemy2Text.color = "#ffcccc";
		else if(enemyList[1].health > 60)
			enemy2Text.color = "#ff9999";
		else if(enemyList[1].health > 40)
			enemy2Text.color = "#ff6666";
		else if(enemyList[1].health > 20)
			enemy2Text.color = "#ff3333";
		else
			enemy2Text.color = "#ff0000";
			
		if(enemyList[2].health >= 100)
			enemy3Text.color = "#ffffff";
		else if(enemyList[2].health > 80)
			enemy3Text.color = "#ffcccc";
		else if(enemyList[2].health > 60)
			enemy3Text.color = "#ff9999";
		else if(enemyList[2].health > 40)
			enemy3Text.color = "#ff6666";
		else if(enemyList[2].health > 20)
			enemy3Text.color = "#ff3333";
		else
			enemy3Text.color = "#ff0000";
	}
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