
/* with help from a tutorial:
   http://www.williammora.com/2013/03/nodejs-tutorial-building-chatroom-with.html
*/

/* module dependencies */
var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , _ = require("underscore");
  
 /* server config */

 // server IP address
 app.set("ipaddr", "127.0.0.1");
 
// server port number 
app.set("port", 8080);

// specify views folder
app.set("views", __dirname + "/views");

// view engine is jade
app.set("view engine", "jade");

// specify where the static content is
app.use(express.static("public", __dirname + "/public"));

// tell server to support JSON, etc
app.use(express.bodyParser());


/* server routing */

// handle route "Get /", as in "http://localhost:8080/"
app.get("/", function(request, response) {
	// show server message
	response.render("index");
});

// POST method to create a chat message
app.post("/message", function(request, response) {
	// request body expects a param named "message"
	var message = request.body.message;
	
	// if message is empty/ wasn't sent it is a bad request
	if (_.isUndefined(message) || _.isEmpty(message.trim())) {
		return response.json(400, {error: "Message is invalid"});
	}
	
	// looks good, let client know
	response.json(200, {message: "Message received"});
});
// start the http server at the port and IP address
http.listen(app.get("port"), app.get("ipaddr"), function() {
	console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});