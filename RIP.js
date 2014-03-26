/**
 * Initialize the Game and starts it.
 */
var game = new Game();

function init() {
	if(game.init())
		game.start();
}

/**
 * Define an object to hold all our images for the game so images
 * are only ever created once
 */
var imageRepository = new function() {

	this.background = new Image();
	this.player = new Image();
	//this.bullet = new Image();

	// Ensure all images have loaded before starting the game
	var numImages = 3;
	var numLoaded = 0;

	function imageLoaded() {
		numLoaded++;
		if (numLoaded === numImages) {
			window.init();
		}
	}

	this.background.onload = function() {
		imageLoaded();
	}
	this.player.onload = function() {
		imageLoaded();
	}
	//this.bullet.onload = function() {
	//	imageLoaded();
	//}

	// Set images src
	this.background.src = "images/backgrounds/grass-tiled.png";
	this.player.src = "images/players/player.png";
	//this.background.src = "images/objects/bullet.png";
}

/**
 * Creates the Drawable object which will be the base class for
 * all drawable objects in the game. Sets up default variables
 * that all child objects will inherit, as well as the defualt
 * functions. 
 */
function Drawable() {	
	this.init = function(x, y, width, height) {
		// Default variables
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;

	// Define abstract function to be implemented in child objects
	this.draw = function() {
	};
	this.move = function() {
	};
}

/**
 * Creates the Background object which will become a child of
 * the Drawable object. The background is drawn on the "background"
 * canvas \
 */
function Background() {

	// Implement abstract function
	this.draw = function() {
		this.context.drawImage(imageRepository.background, this.x, this.y);
	};
}
// Set Background to inherit properties from Drawable
Background.prototype = new Drawable();

function Player() {
	this.speed = 3;
	//this.bulletPool = new Pool(30);
	//this.bulletPool.init();

	//var fireRate = 15;
	var counter = 0;

	this.draw = function() {
		this.context.drawImage(imageRepository.player, this.x, this.y);
	};
	this.move = function() {	
		counter++;
		// Determine if the action is move action
		if (KEY_STATUS.left || KEY_STATUS.right ||
			KEY_STATUS.down || KEY_STATUS.up) {
			// The player moved, so erase it's current image so it can
			// be redrawn in it's new location
			this.context.clearRect(this.x, this.y, this.width, this.height);

			// Update x and y according to the direction to move and
			// redraw the player. Change the else if's to if statements
			// to have diagonal movement.
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0) // Keep player within the screen
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth - this.width;
			} else if (KEY_STATUS.up) {
				this.y -= this.speed
				// if (this.y <= this.canvasHeight/4*3)
				// 	this.y = this.canvasHeight/4*3;
				if (this.y <= 0)
					this.y = 0;
			} else if (KEY_STATUS.down) {
				this.y += this.speed
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}

			// Finish by redrawing the player
			this.draw();
		}

		//if (KEY_STATUS.space && counter >= fireRate) {
		//	this.fire();
		//	counter = 0;
		//}
	};

	/*
	 * Fires two bullets
	 */
	//this.fire = function() {
	//	this.bulletPool.getTwo(this.x+6, this.y, 3,
	//	                       this.x+33, this.y, 3);
	//};
}
Player.prototype = new Drawable();

/**
 * Creates the Game object which will hold all objects and data for
 * the game.
 */
function Game() {
	/*
	 * Gets canvas information and context and sets up all game
	 * objects. 
	 * Returns true if the canvas is supported and false if it
	 * is not. This is to stop the animation script from constantly
	 * running on older browsers.
	 */
	this.init = function() {
		// Get the canvas elements
		this.bgCanvas = document.getElementById('background');
		this.playerCanvas = document.getElementById('players');
		this.mainCanvas = document.getElementById('bullets');

		// Test to see if canvas is supported. Only need to
		// check one canvas
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');
			this.playerContext = this.playerCanvas.getContext('2d');
			//this.mainContext = this.mainCanvas.getContext('2d');

			// Initialize objects to contain their context and canvas
			// information
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

			Player.prototype.context = this.playerContext;
			Player.prototype.canvasWidth = this.playerCanvas.width;
			Player.prototype.canvasHeight = this.playerCanvas.height;

			//Bullet.prototype.context = this.mainContext;
			//Bullet.prototype.canvasWidth = this.mainCanvas.width;
			//Bullet.prototype.canvasHeight = this.mainCanvas.height;

			// Initialize the background object
			this.background = new Background();
			this.background.init(0,0); // Set draw point to 0,0

			// Initialize the player object
			this.player = new Player();
			// Set the player to start near the bottom middle of the canvas
			var playerStartX = this.playerCanvas.width/2 - imageRepository.player.width;
			var playerStartY = this.playerCanvas.height/2;// + imageRepository.player.height*2;
			this.player.init(playerStartX, playerStartY, imageRepository.player.width,
			               imageRepository.player.height);

			return true;
		} else {
			return false;
		}
	};

	// Start the animation loop
	this.start = function() {
		this.player.draw();
		animate();
	};
}



/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */
function animate() {
	requestAnimFrame( animate );
	game.background.draw();
	game.player.move();
	//game.player.bulletPool.animate(); 
}

KEY_CODES = {
  32: 'space',
  65: 'left',
  87: 'up',
  68: 'right',
  83: 'down',
}

// Creates the array to hold the KEY_CODES and sets all their values
// to false. Checking true/flase is the quickest way to check status
// of a key press and which one was pressed when determining
// when to move and which direction.
KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}
/**
 * Sets up the document to listen to onkeydown events (fired when
 * any key on the keyboard is pressed down). When a key is pressed,
 * it sets the appropriate direction to true to let us know which
 * key it was.
 */
document.onkeydown = function(e) {
  // Firefox and opera use charCode instead of keyCode to
  // return which key was pressed.
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
	e.preventDefault();
	KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}
/**
 * Sets up the document to listen to ownkeyup events (fired when
 * any key on the keyboard is released). When a key is released,
 * it sets teh appropriate direction to false to let us know which
 * key it was.
 */
document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
}

/**	
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop, 
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
})();