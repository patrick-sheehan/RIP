function init()
{
	var canvas = document.getElementById("gameCanvas");
	var stage = new createjs.Stage(canvas);

	var background = new createjs.Bitmap("images/backgrounds/grass-tiled.png");
	stage.addChild(background);
	stage.update();
}