// wow - 2020
// This file handle all api calls for the index.html file.

async function digestMessage(message, algorithm) {
	const data = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest(algorithm, data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('');
}

function isRoomFree(roomName, username, roomPassword) {
	return new Promise(async function (resolve, reject) {

		//Password is hashed before sending because of AES encryption which use the same password.
		roomPassword = await digestMessage(roomPassword, "SHA-384");

		//Prepare fetch request
		const body = {
			roomName,
			username,
			roomPassword
		}

		fetch('/api/room', {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}).then(function (response) {
			let contentType = response.headers.get("content-type");
			if (contentType && contentType.indexOf("application/json") !== -1) {
				return response.json().then(function (json) {
					console.log(json);
					if (json.status) {
						resolve(json);
					} else reject(json);
				});
			} else {
				reject("no json");
			}
		})
	})
}