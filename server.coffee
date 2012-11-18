no_calls = process.env.NO_CALLS
express = require "express"
app = express()
server = (require "http").createServer app
io = (require "socket.io").listen server
twilio = require "twilio-js"
unless no_calls then config = require "config"

server.listen 8000
app.use express.static __dirname + "/static"
app.use express.bodyParser()

unless no_calls
	twilio.AccountSid = config.AccountSid
	twilio.AuthToken = config.AuthToken

startACall = (sockID) ->
	console.log("Start a call", sockID)
	unless no_calls
		twilio.Call.create(
			to: config.SupportPhone,
			from: config.PhoneNum,
			url: config.URL + "/call?sockID=#{encodeURIComponent(sockID)}",
			ifMachine: "Hangup",
		)
	else
		agents.emit "call_status", { sockID: sockID, status: "in_progress" }

app.post "/call", (req, res) ->
	sockID = req.query.sockID
	res.header "Content-Type", "text/xml"
	#if phoneNum.match(/\+1[1-9]{10}/g)
	console.log("/call", req.query)
	phoneNum = io.sockets.socket(sockID).dataBlock.phoneNum
	res.send """
	<Response>
		<Dial action="#{config.URL + "/call/status"}">#{phoneNum}</Dial>
	</Response>
	"""
	agents.emit "call_status", { sockID: sockID, status: "in_progress" }

app.post "/call/status", (req, res) ->
	console.log("/call/status", req.body)
	res.header "Content-Type", "text/xml"
	res.send """
	<Response>
	</Response>
	"""

	#agents.emit("call_status",

main = io.sockets.on "connection", (socket) ->
	socket.on "call", (data) ->
		socket.dataBlock = data
		data["sockID"] = socket.id
		console.log(data)
		agents.emit "call", data

agents = io
	.of("/agent")
	.on "connection", (socket) ->
		console.log()#socket)
		socket.on "call", (data) ->
			console.log "Starting a call with #{data.phoneNum}"
			startACall data.sockID
		socket.on "prompt", (data) ->
			io.sockets.socket(data.sockID).emit("prompt", data)
			console.log("Prompting!")
			console.log(data)
