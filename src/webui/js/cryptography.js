// wow - 2020
const availableAlgorithm = ["AES-GCM", "default"];

function decrypt(message, key, algorithm) {
	return new Promise(function (resolve) {
		switch (algorithm) {
			case "AES-GCM":
				aes4js.decrypt(key, message).then(function (decMessage) {
					resolve({algorithm, message: decMessage, error: false});
				}).catch(function () {
					resolve({algorithm, message: message, error: true})
				})
				break;
			case "default":
				resolve({algorithm, message: message, error: false});
				break;
			default:
				resolve({algorithm, message: message, error: true});
		}
	})
}

function isSupported(algorithm) {
	return new Promise(function (resolve) {
		switch (algorithm) {
			case "AES-GCM":
				aes4js.encrypt("x", "x").then(function () {
					resolve(true);
				}).catch(function () {
					resolve(false);
				})
				break;
			case "default":
				resolve(true);
				break;
			default:
				resolve(false);
				break;
		}
	})
}

async function getBestSupportedAlgorithm() {
	for (let i = 0; i < availableAlgorithm.length; ++i) {
		//Try if the algorithm is supported by the browser.
		if (await isSupported(availableAlgorithm[i])) {
			return availableAlgorithm[i];
		}
	}
}

function encrypt(message, key, algorithm = null) {
	return new Promise(async function (resolve, reject) {

		if (algorithm === null) {
			algorithm = await getBestSupportedAlgorithm();
		}
		//Algorithm is now defined, default is the fallback without encryption.
		switch (algorithm) {
			case "AES-GCM":
				aes4js.encrypt(key, message).then(function (decMessage) {
					resolve({algorithm, message: decMessage, isEncrypted: true});
				}).catch(function () {
					resolve({algorithm: "default", message: message, isEncrypted: false});
				})
				break;
			case "default":
				resolve({algorithm: "default", message: message, isEncrypted: false});
				break;
			default:
				resolve({algorithm: "default", message: message, isEncrypted: false});
		}
	})
}