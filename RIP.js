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
var bulletFireRate = 20;	//higher the rate, slower bullet shoots
var bulletFrameCounter = 0;
var bulletSpeed = 15;

var bulletArray = [];

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
	this.image.x = player.image.x;
	this.image.y = player.image.y;
	this.initialX = this.image.x;
	this.initialY = this.image.y;
	this.angle = player.image.rotation;
	console.log("bullet count: " + bulletArray.length);
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
		bulletArray[i].image.x = Math.cos(bulletArray[i].angle) * bulletSpeed  + bulletArray[i].initialX;
		bulletArray[i].image.y = Math.sin(bulletArray[i].angle) * bulletSpeed + bulletArray[i].initialY;
		bulletArray[i].initialX = bulletArray[i].image.x;
		bulletArray[i].initialY = bulletArray[i].image.y;
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
	if(bulletFrameCounter > bulletFireRate)
	{
		bulletFrameCounter = 0;
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