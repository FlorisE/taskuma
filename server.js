//const express = require('express');
//const app = express();
//
//const port = 3001;
//
//app.get('/', function (req, res) {
//    res.send('');
//});
//
//app.listen(port, function() {
//    console.log(`Taskuma server listening on port ${port}`);
//});
//
var ws = require("nodejs-websocket");

var server = ws.createServer();
server.listen(3001, "localhost", () => {
  server.on('connection', (connection) => {
    console.log("New client connected");
    connection.on("text", (message) => {
      console.log("Message received: " + message);
      server.connections.forEach((broadcast) => {
        broadcast.send(message);
      });
    });
    connection.on("close", (code, reason) =>
      console.log("Client disconnected")
    );
  });
});
