"use strict";

var Wink = require("../../lib");
var apiCredentials = require("../credentials");

var wink = new Wink(apiCredentials);

wink.on("ready", function() {
    var lock = wink.getDeviceByName("Lock");

    if (!lock.isLocked()) {
        lock.lock();
    }
});


//Create a web server
//Do an API to toggle the light
//Add a web page with a button to toggle the light
