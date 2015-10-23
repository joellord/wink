"use strict";

var Wink = require("../lib");
var apiCredentials = require("./credentials");

var wink = new Wink(apiCredentials);

wink.on("ready", function() {
    var light = wink.getDeviceByName("WinkPresentationLight1");
    light.on();
    //light.off();
    //light.dim(10);
});