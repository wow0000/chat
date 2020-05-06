// wow - 2020

const express = require("express");
const app = express();
let express_ws = require("express-ws")(app);

const endpoint = require("./src/endpoint/chat");

const settings = {
	port: 8585,
	webSrc: "src/webui/"
};

app.use(express.static(settings.webSrc));
app.use('/api', endpoint);

app.listen(settings.port, () => console.log(`Chat listening on port: ${settings.port}`));