// wow - 2020
// This file manage the UI state of the chat.html file

function write(text) {
	let scrolledToBottom = (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight
	let pre = document.querySelector('pre');
	pre.textContent += text;

	if (scrolledToBottom)
		window.scrollTo(0, document.body.scrollHeight);
}

function writeLine(text) {
	write(text + "\n");
}

function debug_writeLotsOfLines(amount) {
	for (let i = 0; i < amount; i++) {
		writeLine("debug");
	}
	writeLine("end");
}

/**
 * @param {boolean} state
 */
function button_disable(state) {
	document.querySelector("button").disabled = state;
}

/**
 * @param {function} func
 */
function mapToButton(func) {
	document.querySelector("button").addEventListener("click", func);
}

function getTextContent() {
	return document.querySelector("input").value;
}

/**
 * @param {object} new_status
 */
function updateInfoBar(new_status) {
	let channel = document.getElementById("span-channel");
	let status = document.getElementById("span-status");

	channel.textContent = sessionStorage.getItem("roomName");
	status.classList = []; // reset all classes using js trick
	if (new_status.status === 1) {
		status.classList.add("text-success");
		status.textContent = `Connected as ${sessionStorage.getItem("username")}`;
	} else if (new_status.status === 0) {
		status.classList.add("text-warning");
		status.textContent = `Connecting as ${sessionStorage.getItem("username")}`;
	} else {
		status.classList.add("text-danger");
		status.textContent = `Disconnected`;
	}
}

let infoChannel = document.getElementById("info-channel")
let sticky = infoChannel.offsetTop;

window.addEventListener("scroll", function () {
	if (window.scrollY > 30) {
		infoChannel.classList.add("sticky")
	} else {
		infoChannel.classList.remove("sticky");
	}
})

document.querySelector("input").addEventListener("keyup", function (e) {
	if (e.key === "Enter") {
		document.querySelector("button").click();
	}
})
