var stage;
var player;
var background;
var canvas;

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
var currentBulletFireRate = 20;	//higher the rate, slower bullet shoots
var BULLET_FIRERATE_NORMAL = 20;
var BULLET_FIREREATE_POWERUP = 5;
var bulletFrameCounter = 0;
var bulletSpeed = 15;

var bulletArray = [];
var powerupExists = false;
var powerup;			//object
var playerPowerupTime = 0;	//time counter (in ticks) that player can have powerup
var MAX_POWERUP_TIME = 500;	//set time that player gets it
var removePlayerPowerup = false;	//so that on each tick it doesn't change image back
var POWERUP_ODDS = 500;	// "1/this" chance of powerup per tick


document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;

function init()
{
	canvas = document.getElementById("gameCanvas");
	stage = new createjs.Stage(canvas);

	background = new createjs.Bitmap("images/backgrounds/grass-tiled.png");
	stage.addChild(background);

	createjs.Ticker.setFPS(60);
	createjs.Ticker.addEventListener("tick", tick);
	stage.addEventListener("stagemousedown", mouseClick);
	stage.addEventListener("stagemouseup", mouseUnclick);
	player = new Player();

	stage.update();
}

function tick(event)
{
	movePlayer();
	rotatePlayer();
	if(mousePressed)
		playerShoot();
	moveBullets();
	determinePowerup();
	checkPowerupCollision();
	stage.update();
}

function Player()
{
	this.image = new createjs.Bitmap("images/player.png");
	this.image.x = Math.random()*canvas.width;
	this.image.y = Math.random()*canvas.height;
	//set registration points to center of image
	this.image.regX = 50;
	this.image.regY = 50;
	stage.addChild(this.image);
}

function Bullet()
{
	this.image = new createjs.Bitmap("images/bullet.png");
	this.image.regX = 2;
	this.image.regY = 2;
	this.image.x = player.image.x;
	this.image.y = player.image.y;
	this.initialX = this.image.x;
	this.initialY = this.image.y;
	this.angle = player.image.rotation;

	var mouseX = stage.mouseX;
	var mouseY = stage.mouseY;
	this.angle = (Math.atan2(mouseY - this.image.y, mouseX - this.image.x)* (180/Math.PI)) - 90;

	console.log("bullet count: " + bulletArray.length);
	stage.addChild(this.image);
}

function Powerup()
{
	this.image = new createjs.Bitmap("images/bulletPowerup.png");
	this.image.regX = 23;
	this.image.regY = 23;
	this.image.x = canvas.width / 2;
	this.image.y = canvas.height / 2;

	stage.addChild(this.image);
}

function movePlayer()
{
	//doing each combination, as if you detect them separately then the player moves sqrt(2) as fast on diagonals
	if(upPressed && leftPressed)
	{
		player.image.y -= movementSpeed / 1.4;
		player.image.x -= movementSpeed / 1.4;
	}
	else if(upPressed && rightPressed)
	{
		player.image.y -= movementSpeed / 1.4;
		player.image.x += movementSpeed / 1.4;
	}
	else if(rightPressed && downPressed)
	{
		player.image.x += movementSpeed / 1.4;
		player.image.y += movementSpeed / 1.4;
	}
	else if(leftPressed && downPressed)
	{
		player.image.x -= movementSpeed / 1.4;
		player.image.y += movementSpeed / 1.4;
	}
	else if(upPressed)
	{
		player.image.y -= movementSpeed;
	}
	else if(downPressed)
	{
		player.image.y += movementSpeed;
	}
	else if(leftPressed)
	{
		player.image.x -= movementSpeed;
	}
	else if(rightPressed)
	{
		player.image.x += movementSpeed;
	}

	if(player.image.x < 0)
	{
		player.image.x = 0;
	}
	if(player.image.y < 0)
	{
		player.image.y = 0;
	}
	if(player.image.x  > canvas.width)
	{
		player.image.x = canvas.width;
	}
	if(player.image.y > canvas.height)
	{
		player.image.y = canvas.height;
	}
}

function moveBullets()
{
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
{
	var mouseX = stage.mouseX;
	var mouseY = stage.mouseY;
	var rotationAngle = Math.atan2(mouseY - player.image.y, mouseX - player.image.x);
	player.image.rotation = rotationAngle * (180/Math.PI);
}

function playerShoot()
{
	if(bulletFrameCounter == 0)
	{
		var bullet = new Bullet();
		bulletArray.push(bullet);
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
	else if (removePlayerPowerup)		//player powerup time is over
	{
		var originalX = player.image.x;
		var originalY = player.image.y;

		removePlayerPowerup = false;
		stage.removeChild(player.image);
		player.image = new createjs.Bitmap("images/player.png");
		player.image.regX = 50;
		player.image.regY = 50;
		player.image.x = originalX;
		player.image.y = originalY;
		stage.addChild(player.image);

		currentBulletFireRate = BULLET_FIRERATE_NORMAL;
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

			stage.removeChild(player.image);
			player.image = new createjs.Bitmap("images/playerWithPowerup.png");
			player.image.regX = 50;
			player.image.regY = 50;
			player.image.x = originalX;
			player.image.y = originalY;
			stage.addChild(player.image);
			stage.removeChild(powerup.image);

			powerupExists = false;
			removePlayerPowerup = true;
			playerPowerupTime = MAX_POWERUP_TIME;
			currentBulletFireRate = BULLET_FIREREATE_POWERUP;
		}
	}
}

function mouseClick(e)
{
	mousePressed = true;
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