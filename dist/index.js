"use strict";

var Promise = require("bluebird");
var request = require("request");
var Emitter = require("events").EventEmitter;
var util = require("util");

var WINK_API_BASE_URL = "https://winkapi.quirky.com/";
var AUTH_URL = "oauth2/token";

var Wink = function Wink(options) {
				//constructor
				this.keys = options;
				this.isConnected = false;
				this.connectionTokens = {};
				this.devices = [];

				this._init();
};

Wink.prototype._init = function () {
				self.emit("ready");
};

util.inherits(Wink, Emitter);

module.exports = Wink;