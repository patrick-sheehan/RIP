var io = require('socket.io').listen(8080);

io.sockets.on('connection', function(socket) {
	socket.emit('message', "hello world");	
	
	socket.on('message', function(data) {
		socket.broadcast.emit('message', data);
	});
});