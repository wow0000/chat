// wow - 2020

const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const settings = require("./config.json");

const app = express();
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'"]
		}
	},
	crossdomain: true,
	referrerPolicy: true
}));


function defineHeaders(app) {
	const endpoint = require("./src/endpoint/chat");
	app.use('/api', endpoint);

	app.use(express.static(settings.webSrc));
}

if (settings.useHTTP) {
	let express_ws = require("express-ws")(app);
	defineHeaders(app);
	app.listen(settings.HTTPPort, () => console.log(`HTTP Chat listening on port: ${settings.HTTPPort}`));
}
if (settings.useSSL) {
	const https = require("https");
	const httpsServer = https.createServer({
		key: fs.readFileSync(settings.privateKey),
		cert: fs.readFileSync(settings.certificate),
	}, app);

	defineHeaders(app);
	let express_ws = require("express-ws")(app, httpsServer);
	httpsServer.listen(settings.SSLPort, () => {
		console.log(`HTTPS Chat listening on port: ${settings.SSLPort}`)
	})
}
