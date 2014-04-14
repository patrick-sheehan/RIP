var express = require('express');
var port = 8080;
var app = express();    //create our app with express
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var playerCount = 0;
var roomCount = 0;

io.sockets.on('connection', function(client) { // client is connected

	playerCount++;
	client.on('message_to_server', function(player){ // client sent player data
		
		if (player.ID == -1) {
			player.ID = playerCount;
		}

		//console.log('playerID = ' + player.ID);	
		console.log("player timestamp: " + player.cTimestamp);
		console.log("player position: (" + player.x_val.toFixed(2) + ", " + player.y_val.toFixed(2) + ")");
		//console.log("player health: " + player.health);
		console.log("ET CETERA...\n");

		// io.sockets.emit('message_to_client', 'server received your data') 
		// TODO: probably use "socket.broadcast.emit()" to send to message to all sockets EXCEPT the sender
	});
});

//io.sockets.on disconnection?

app.configure(function() {
	app.use(express.static(__dirname)); //sets the static file location
	app.use(express.logger('dev')); //logs every request to the console
	app.use(express.cookieParser());
	app.use(express.bodyParser()); // pull information from html in POST
	app.use(express.methodOverride()); //simulate DELETE and PUT
	app.use(express.session({
		secret: 'pariscongobomie'
	}));
});

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

server.listen(port, function() {
	console.log("App listening on port " + port);
});
