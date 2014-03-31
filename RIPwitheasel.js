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
	//doing each combination, as if you detect them separately then the player moves sqrt(2) as fast on diagonals
	if(upPressed && leftPressed)
	{
		console.log("left and up");
		player.image.y -= movementSpeed / 1.4;
		player.image.x -= movementSpeed / 1.4;
	}
	else if(upPressed && rightPressed)
	{
		console.log("right and up");
		player.image.y -= movementSpeed / 1.4;
		player.image.x += movementSpeed / 1.4;
	}
	else if(rightPressed && downPressed)
	{
		console.log("right and down");
		player.image.x += movementSpeed / 1.4;
		player.image.y += movementSpeed / 1.4;
	}
	else if(leftPressed && downPressed)
	{
		console.log("left and down");
		player.image.x -= movementSpeed / 1.4;
		player.image.y += movementSpeed / 1.4;
	}
	else if(upPressed)
	{
		console.log("up");
		player.image.y -= movementSpeed;
	}
	else if(downPressed)
	{
		console.log("down");
		player.image.y += movementSpeed;
	}
	else if(leftPressed)
	{
		console.log("left");
		player.image.x -= movementSpeed;
	}
	else if(rightPressed)
	{
		console.log("right");
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
	if((player.image.x + 100) > canvas.width)
	{
		player.image.x = canvas.width - 100;
	}
	if((player.image.y + 100) > canvas.height)
	{
		player.image.y = canvas.height - 100;
	}



	stage.update();
}

function Player()
{
	this.image = new createjs.Bitmap("images/players/player_up.png");
	this.image.x = Math.random()*canvas.width;
	this.image.y = Math.random()*canvas.height;
	stage.addChild(this.image);
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