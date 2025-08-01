"use strict";
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const apiRoutes = require("./routes/api.js");
const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner");

const app = express();

const helmet = require("helmet");
app.use(
	helmet({
		// Only allow site to be loaded in an iframe from the same origin
		frameguard: {
			action: "sameorigin",
		},
		// Do not allow DNS prefetching
		dnsPrefetchControl: true,
		// Only allow site to send the referrer for same-origin requests
		referrerPolicy: {
			policy: "same-origin",
		},
	})
);

app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({ origin: "*" })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route("/b/:board/").get(function (req, res) {
	res.sendFile(process.cwd() + "/views/board.html");
});
app.route("/b/:board/:threadid").get(function (req, res) {
	res.sendFile(process.cwd() + "/views/thread.html");
});

//Index page (static HTML)
app.route("/").get(function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use(function (req, res, next) {
	res.status(404).type("text").send("Not Found");
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
	console.log("Your app is listening on port " + listener.address().port);
	if (process.env.NODE_ENV === "test") {
		console.log("Running Tests...");
		setTimeout(function () {
			try {
				runner.run();
			} catch (e) {
				console.log("Tests are not valid:");
				console.error(e);
			}
		}, 1500);
	}
});

module.exports = app; //for testing
