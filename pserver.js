var express = require('express');
var port = 8080;
var app = express();    //create our app with express
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


io.sockets.on('connection', function(client) {
	//client.emit('text_msg', {msg: 'welcome to connection'});

	client.on('message_to_server', function(data){
		console.log("client position: (" + data.x_val + ", " + data.y_val + ")");

		io.sockets.emit('message_to_client', 'server received your data')

		// probably use "socket.broadcast.emit()" to send to all sockets EXCEPT the sender
	});
});


// io.sockets.on('tick-emit', function() {
// 	console.log('heard tick emission');
// });

// io.sockets.on('connection', function(socket) {
// 	socket.on('tick', function(data) {
// 		console.log('tick message sent');
// 	});
// });

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
