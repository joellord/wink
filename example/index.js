"use strict";

var Wink = require("../lib");
var apiCredentials = require("./credentials");

var wink = new Wink(apiCredentials);

wink.on("ready", function(devices) {
    console.log("ready");

    var light = wink.getDeviceByName("WinkPresentationLight1");
    if (light.getBrightness() > 0) {
        light.off();
    } else {
        light.dim(10);
    }

    var thermostat = wink.getDevicesByType(wink.deviceTypes.THERMOSTAT)[0];
    console.log(thermostat.getTemperature(thermostat.units.FAHRENHEIT) + " F");

    //var tripper = wink.getDeviceByName("Tripper");
    //tripper.refresh().then(function() {
    //    console.log(tripper._data);
    //});
    //
    //var lock = wink.getDeviceByName("Lock");
    //
    //if (lock.isLocked()) {
    //    lock.lock();
    //}

    //tripper.isCurrentlyOpened().then(function(opened) {
    //    if(opened) {
    //        console.log("Door is opened");
    //    }
    //});

    //setTimeout(function() {
    //    console.log("light off");
    //    light.off();
    //}, 0);
    //setTimeout(function() {
    //    console.log("light 10%");
    //    light.dim(10);
    //}, 3000);
    //setTimeout(function() {
    //    console.log("light on");
    //    light.on();
    //}, 6000);
    //setTimeout(function() {
    //    console.log("light off");
    //    light.off();
    //}, 9000);

});

//Keep process running
//setInterval(function(){}, Math.POSITIVE_INFINITY);