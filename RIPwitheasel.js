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

var movementSpeed = 5;

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
	player = new Player();

	stage.update();
}

function tick(event)
{
	movePlayer();
	rotatePlayer();

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

function rotatePlayer()
{
	var mouseX = stage.mouseX;
	var mouseY = stage.mouseY;
	var rotationAngle = Math.atan2(mouseY - player.image.y, mouseX - player.image.x);
	player.image.rotation = rotationAngle * (180/Math.PI);
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