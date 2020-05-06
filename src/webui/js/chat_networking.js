// wow - 2020
// This file handle all api calls for the index.html file.

const Js = JSON.stringify;

async function digestMessage(message, algorithm) {
	const data = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest(algorithm, data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('');
}

async function connect({username, room, roomPassword}) {
	roomPassword = await digestMessage(roomPassword, "SHA-384");
	//support for http + https protocols.
	let protocol = "ws" + (location.protocol[4] === "s" ? "s" : "");
	let ws = new WebSocket(`${protocol}://${location.host}/api/ws`);
	ws.onopen = function (event) {
		updateInfoBar({status: 0});
		ws.send(Js({
			action: "login",
			username: username,
			roomName: room,
			roomPassword: roomPassword
		}))
	}

	mapToButton(function () {
		if (getTextContent() !== "") {
			aes4js.encrypt(roomPassword, getTextContent()).then(function (res) {
				ws.send(Js({
					action: "talk",
					isEncrypted: true,
					message: res
				}));
			}).catch(function () {
				ws.send(Js({
					action: "talk",
					isEncrypted: false,
					message: getTextContent()
				}));
			})
			document.querySelector("input").value = "";
		}
	})

	ws.onclose = function (event) {
		updateInfoBar({status: -1});
		button_disable(true);
		writeLine("You have been disconnected from the chat")
	}

	ws.onmessage = function (msg) {
		let data = JSON.parse(msg.data);
		console.log(data);
		if (!data.status) {
			writeLine("An error happened\n" + data.error)
			console.error(data);
		} else {
			switch (data.action) {
				case "login":
					button_disable(false);
					updateInfoBar({status: 1});
					let strMessage;
					if (data.newRoom) strMessage = `<You created #${room}>`;
					else strMessage = `<You joined @${data.op} in room #${room}>`;
					writeLine(strMessage);
					break;
				case "income_message":
					if (data.isEncrypted) {
						aes4js.decrypt(roomPassword, data.message).then(function (decMessage) {
							writeLine(`<S@${data.from}> ${decMessage}`);
						}).catch(function () {
							writeLine(`<E@${data.from}> sent a message that cannot be decrypted.`)
						})
					} else
						writeLine(`<U@${data.from}> ${data.message}`)
					break;
				case "information":
					switch (data.type) {
						case "join":
							writeLine(`<Server> @${data.username} joined the channel`);
							break;
						case "new_op":
							writeLine(`<Server> @${data.username} is now the operator of this channel`);
							break;
						case "leave":
							writeLine(`<Server> @${data.username} left the channel`);
							break;
					}
					break;
				default:
					console.log("Unsupported action: ", data);
			}
		}
	}

}

// initialisation

//pre-check to see if sessionStorage is still valid
if (!sessionStorage.getItem("roomName")) location.replace("/");

connect({
	username: sessionStorage.getItem("username"),
	room: sessionStorage.getItem("roomName"),
	roomPassword: sessionStorage.getItem("roomPassword")
}).then();