express = require 'express'
app = express()
server = (require 'http').createServer app
io = (require 'socket.io').listen server

server.listen 8000
app.use express.static __dirname + '/static'

main = io.sockets.on "connection", (socket) ->
	socket.on "call", (data) ->
		data["sockID"] = socket.id
		console.log(data)
		agents.emit "call", data

agents = io
	.of("/agent")
	.on "connection", (socket) ->
		console.log()#socket)
		socket.on "prompt", (data) ->
			io.sockets.socket(data.sockID).emit("prompt", data)
			console.log("Prompting!")
			console.log(data)
