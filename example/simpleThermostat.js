"use strict";

var Wink = require("../lib");
var apiCredentials = require("./credentials");

var wink = new Wink(apiCredentials);

wink.on("ready", function() {
    var thermostat = wink.getDevicesByType(wink.deviceTypes.THERMOSTAT)[0];

    console.log("Current temperature: " + thermostat.getTemperature(thermostat.units.CELSIUS) + " °C");
    console.log("Current temperature: " + thermostat.getTemperature(thermostat.units.FAHRENHEIT) + " F");
});