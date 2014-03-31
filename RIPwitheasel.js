var stage;
var player;

var upKey = 87;
var downKey = 83;
var leftKey = 65; 
var rightKey = 68;

var upPressed;
var downPressed;
var leftPressed;
var rightPressed;

document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;

function init()
{
	var canvas = document.getElementById("gameCanvas");
	stage = new createjs.Stage(canvas);

	var background = new createjs.Bitmap("images/backgrounds/grass-tiled.png");
	stage.addChild(background);

	createjs.Ticker.setFPS(60);

	player = new Player();

	stage.update();
}

function tick(event)
{
	if(upPressed || downPressed || leftPressed || rightPressed)
	{
		console.log("test");
		player.move();
	}
	stage.update();
}

function Player()
{
	this.image = new createjs.Bitmap("images/players/player_up.png");

	stage.addChild(this.image);

	this.move = function()
	{
		if(upPressed)
			this.y -= 1;
		if(downPressed)
			this.y += 1;
		if(leftPressed)
			this.x -= 1;
		if(rightPressed)
			this.x += 1;
	}
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