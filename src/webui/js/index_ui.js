// wow - 2020
// This file manage the state of UI elements on the index.html file.

let warningClass = ""

function checkIfInputsAreFilled() {
	let inputs = document.querySelectorAll("input");
	for (let i = 0; i < inputs.length; ++i) {
		if (inputs[i].value === "")
			return {filled: false, element: inputs[i]};
	}
	return {filled: true};
}

function subscribeToUpdates() {
	let inputs = document.querySelectorAll("input");
	for (let i = 0; i < inputs.length; ++i) {
		inputs[i].addEventListener("input", unlockButton)
	}

	let buttons = document.querySelectorAll("button");
	for (let i = 0; i < buttons.length; ++i) {
		buttons[i].addEventListener("click", buttonIsPressed)
	}
}

function changeButtonState(state) {
	let button = document.querySelector("button");

	for (let i = 0; i < button.children.length; ++i) {
		button.children[i].hidden = true;
	}

	switch (state) {
		case "locked":
			button.querySelector(".button-room-locked").hidden = false;
			button.disabled = true;
			break;
		case "checking":
			button.querySelector(".button-room-check").hidden = false;
			button.disabled = true;
			break;
		case "join":
			button.querySelector(".button-room-join").hidden = false;
			button.disabled = false;
			break;
	}
}

function unlockButton() {
	let button = document.querySelector("button");
	if (checkIfInputsAreFilled().filled) {
		changeButtonState("join");
	} else {
		changeButtonState("locked")
	}
}

async function buttonIsPressed() {
	//Reset the alert
	document.getElementById("invalid-room").hidden = true;
	//Update the UI
	changeButtonState("checking");

	let roomName = document.getElementById("input-roomName").value;
	let username = document.getElementById("input-username").value;
	let roomPassword = document.getElementById("input-roomPassword").value;
	console.log("Starting checking")

	isRoomFree(roomName, username, roomPassword).then(function () {
		//The room is free.
		//TODO: implement the other page "inch'allah"
		console.log("it's okay")
		sessionStorage.setItem("roomName", roomName);
		sessionStorage.setItem("username", username);
		sessionStorage.setItem("roomPassword", roomPassword);
		location.replace("/chat.html");
	}).catch(function () {
		//The room isn't.
		document.getElementById("invalid-room").hidden = false;
		changeButtonState("join");
	})
}

subscribeToUpdates();