'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(3000);

var io = socketIO.listen(app);
io.on('connection', function(socket) {
  console.log(socket.id)
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('join', function(id) {
    socket.join(id);
    console.log(io.sockets.adapter.rooms[id].length)

    // 监听这个房间的信息
    socket.on(id, function (data) {
      // 往另一个房间发送
      socket.broadcast.emit('exchange', data)
    })
  });

  socket.on('exit', function() {
    socket.disconnect(true)
  })
});
