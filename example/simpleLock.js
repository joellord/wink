"use strict";

var Wink = require("../lib");
var apiCredentials = require("./credentials");

var wink = new Wink(apiCredentials);

wink.on("ready", function() {
    var lock = wink.getDeviceByName("Lock");

    if (!lock.isLocked()) {
        lock.lock();
    }
});