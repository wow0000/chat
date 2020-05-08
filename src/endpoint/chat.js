// wow - 2020
// This file is the primary endpoint and manage all server-side logic about chat handling. (Mainly targeted broadcast)

let bodyParser = require('body-parser')
let express = require('express');
let router = express.Router();

const Js = JSON.stringify;

router.use(bodyParser.json())

let rooms = {};

function createRoom({roomName, operatorName, operatorWS, hashedPassword}) {
	if (checkIfRoomExists(roomName))
		return false;

	rooms[roomName] = {
		operator: {
			name: operatorName,
			ws: operatorWS
		},
		hashedPassword,
		creationTime: new Date(),
		peoples: [operatorWS],
		max_peoples: 100,
	}
	return true;
}

/**
 * return false if room does not exists.
 * @return {boolean}
 */
function checkIfRoomExists(roomName) {
	if (rooms[roomName] === undefined)
		return false;
	return true;
}

/**
 * @param {WebSocket} ws
 * @param {String} room
 */
function defineNewOperator(ws, room) {
	//Define him as an owner and tell everyone about it.
	rooms[room].operator = {
		name: ws.account.username,
		ws: ws
	}
	ws.account.owner = true;
	broadcast(room, {status: true, action: "information", type: "new_op", username: ws.account.username})
}

function broadcast(room, message) {
	if (!checkIfRoomExists(room)) return;
	rooms[room].peoples.forEach(function (ws) {
		try {
			ws.send(Js(message));
		} catch (e) {
		}
	})
}

function removeUserFromRoom(username, roomName) {
	let room = rooms[roomName];
	//Send them about left
	broadcast(roomName, {status: true, action: "information", username, type: "leave"})
	for (let i = 0; i < room.peoples.length; ++i) {
		let cws = room.peoples[i];
		if (cws === undefined || cws.account === undefined)
			continue;
		if (cws.account.username === username)
			delete room.peoples[i]
		// If he was an operator name the first one that joined.
		if (room.operator.name === username) {
			let foundSomeone = false;
			for (let i = 0; i < room.peoples.length; ++i) {
				//This condition is for peoples that could have left before him.
				if (room.peoples[i] !== undefined) {
					foundSomeone = true;
					//Make him admin
					defineNewOperator(room.peoples[i], roomName);
					break;
				}
			}
			//Delete the room if nobody was found
			if (!foundSomeone) {
				delete (room[roomName]);
				break;
			}
		}
	}
	cleanupRoom(roomName);
	//delete the room if nobody is in there
	if (room.peoples.length === 0) {
		console.log("deleted")
		delete (rooms[roomName]);
	}

	//console.table(room);
	console.table(rooms)
}


function checkNickname(roomName, username) {
	let room = rooms[roomName];
	for (let i = 0; i < room.peoples.length; ++i) {
		try {
			if (room.peoples[i].account.username === username) {
				return true;
			}
		} catch (e) {
		}
	}
	return false;
}

function cleanupRoom(roomName) {
	let newPeoples = [];
	let room = rooms[roomName];
	for (let i = 0; i < room.peoples.length; i++) {
		if (room.peoples[i] !== undefined) {
			newPeoples.push(room.peoples[i]);
		}
	}
	room.peoples = newPeoples;
}

function commandHandler(command, data, ws) {

}

router.get("/debug", function (req, res) {
	console.log(rooms);
	res.end();
})

router.post("/room", function (req, res) {
	let room = rooms[req.body.roomName];
	if (typeof req.body.roomName !== "string" || typeof req.body.username !== "string" || typeof req.body.roomPassword !== "string") {
		res.json({"status": false, "human-readable": "bad request.", why: "badRequest"});
		return;
	}

	if (req.body.roomName.length > 50 || req.body.username.length > 30) {
		res.json({"status": false, "human-readable": "max chars exceeded", why: "maxChars"});
		return;

	}

	if (!checkIfRoomExists(req.body.roomName)) {
		res.json({"status": true, "human-readable": "free-room"}) // Free room !
		return;
	}

	if (room.peoples.length >= rooms[req.body.roomName].max_peoples) {
		res.json({"status": false, "human-readable": "invalid", why: "full"});
		return;
	}

	if (room.hashedPassword !== req.body.roomPassword) {
		res.json({"status": false, "human-readable": "invalid", why: "password"});
		return;
	}

	if (checkNickname(req.body.roomName, req.body.username)) {
		res.json({"status": false, "human-readable": "nickname already taken", why: "nickname"})
		return;
	}

	res.json({"status": true, "human-readable": "ready-to-authenticate"})
});

router.ws("/ws", function (ws, req) {
	ws.on('message', function (msg) {
		try {
			//Parse the message to JSON, a message should always be in JSON
			let data = JSON.parse(msg);
			console.log(data);
			let action = data.action;
			if (action === "login") {
				//Check if he's already logged in.
				if (ws.account !== undefined)
					return ws.send(Js({status: false, error: "already logged in", action}))

				//Check about provided information
				if (typeof data.roomName !== "string" || typeof data.username !== "string" || typeof data.roomPassword !== "string") {
					//One of the information is not good try again later.
					return ws.send(Js({status: false, error: "bad request", action}))
				}
				//Check if the room already exists
				if (checkIfRoomExists(data.roomName)) {
					//then verify if someone is already log-in and if the password is good.
					if (rooms[data.roomName]["hashedPassword"] !== data.roomPassword)
						return ws.send(Js({status: false, action, error: "Incorrect password"}));

					if (checkNickname(data.roomName, data.username))
						return ws.send(Js({"status": false, action, error: "Nickname already taken"}));

					//he can now join the room.
					rooms[data.roomName].peoples.push(ws);

					ws.account = {room: data.roomName, owner: false, username: data.username};
					console.table(rooms);
					broadcast(data.roomName, {
						status: true,
						action: "information",
						type: "join",
						username: data.username
					})
					return ws.send(Js({status: true, action, newRoom: false, op: rooms[data.roomName].operator.name}));
				} else {
					//we should create him a room.
					createRoom({
						roomName: data.roomName,
						operatorName: data.username,
						operatorWS: ws,
						hashedPassword: data.roomPassword
					});
					ws.account = {room: data.roomName, owner: true, username: data.username};
					return ws.send(Js({status: true, action, newRoom: true}));
				}
			} else if (action === "talk") {
				if (ws.account === undefined)
					return ws.send(Js({status: false, error: "not logged in", action}));

				if (typeof data.isEncrypted !== "boolean" || typeof data.algorithm !== "string" || data.algorithm.length > 10)
					return ws.send(Js({status: false, action, error: "bad request"}));

				if (!data.isEncrypted && typeof data.message !== "string")
					return ws.send(Js({status: false, action, error: "bad request"}));

				broadcast(ws.account.room, {
					status: true,
					action: "income_message",
					algorithm: data.algorithm,
					isEncrypted: data.isEncrypted,
					message: data.message,
					from: ws.account.username
				});
			}
		} catch (e) {
			//An error happened a.k.a. bad request
			console.error(e);
			return ws.send(Js({status: false, error: "bad request"}))
		}
	});
	ws.on('close', function (event) {
		//Handle disconnections for logged in clients
		if (ws.account !== undefined) {
			console.log("disconnect" + ws.account.username)
			removeUserFromRoom(ws.account.username, ws.account.room);
		}
	})
})

module.exports = router;