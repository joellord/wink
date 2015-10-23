"use strict";

var Wink = require("../lib");
var apiCredentials = require("./credentials");

var wink = new Wink(apiCredentials);

wink.on("ready", function() {
    var light1 = wink.getDeviceByName("WinkPresentationLight1");
    var light2 = wink.getDeviceByName("WinkPresentationLight2");

    var lightOn = function(light) {
        light.on();
    };
    var lightOff = function(light) {
        light.off();
    };
    var fifty = function(light) {
        light.dim(20);
    };
    var events = [
        function() {
            lightOn(light1);
            lightOff(light2);
        },
        function() {
            fifty(light1);
            fifty(light2);
        },
        function() {
            lightOff(light1);
            lightOn(light2);
        }
    ];
    var j = 0;
    for (var i = 0; i < 30; i+=2) {
        setTimeout(events[j], i*1000);
        j++;
        if (j >= 3) j=0;
    }
    setTimeout(function() {
        light1.off();
        light2.off();
    }, 32000);
});