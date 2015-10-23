var Promise = require("bluebird");
var request = require("request");
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var WINK_API_BASE_URL = "https://winkapi.quirky.com/";
var AUTH_URL = "oauth2/token";
var URL = {
    DEVICES: "users/me/wink_devices",
    REFRESH: "{device_type}/{device_id}",
    UPDATE: "{device_type}/{device_id}"
};

var connectionTokens = {};
var isConnected = false;

var WINK = {
    DEVICE_TYPE: {
        EGGTRAY: "eggminder",
        HUB: "hub",              //hub_id
        LIGHT: "light_bulbs",          //light_bulb_id
        LOCK: "locks",            //lock_id
        TRIPPER: "tripper",    //sensor_pod_id
        SMOKE_DETECTOR: "smokedetector",    //smoke_detector_id
        THERMOSTAT: "thermostats"
    }
};
var DEBUGGER = true;

function Wink(keys) {
    this.keys = keys;
    isConnected = false;
    connectionTokens = {};
    this.init();
    this.devices = [];
    this.deviceTypes = WINK.DEVICE_TYPE;
}

util.inherits(Wink, EventEmitter);

Wink.prototype.init = function () {
    this.log("Init");

    var self = this;
    this.connect().then(function() {
        return self.getDevices();
    }, function(err) {
        self.log(err);
    }).then(function(devicesFromServer) {
        for (var i = 0; i < devicesFromServer.length; i++) {
            self.devices.push(self.getWinkDeviceFromServerData(devicesFromServer[i]));
        }
        self.emit("ready", self.devices);
    });
};

Wink.prototype.log = function (text) {
    if (DEBUGGER) {
        console.log(text);
    }
};

Wink.prototype.connect = function() {
    var res, rej;
    var p = new Promise(function (resolve, reject) {res = resolve; rej = reject;});
    var self = this;

    winkCall.call(this, "POST", AUTH_URL, JSON.stringify(this.keys)).then(function(body) {
        if (body.data.error) {
            isConnected = false;
            rej("Cannot connect to API. " + body.data.error);
        } else {
            isConnected = true;
            connectionTokens = body.data;
            res();
        }
    });

    return p;
};

Wink.prototype.getWinkDeviceFromServerData = function(original) {
    var device = {};
    var type;
    if (original.eggtray_id) {
        //EggMinder
        type = WINK.DEVICE_TYPE.EGGTRAY;
    }
    if (original.hub_id) {
        //Hub
        type = WINK.DEVICE_TYPE.HUB;
    }
    if (original.light_bulb_id) {
        //Light
        type = WINK.DEVICE_TYPE.LIGHT;
        device = new Wink.Light(original);
    }
    if (original.lock_id || original.parent_object_type === "lock") {
        //Lock
        type = WINK.DEVICE_TYPE.LOCK;
        if (original.lock_id) {
            //This is a lock
            device = new Wink.Lock(original);
        } else {
            //This is a lock user
        }
    }
    if (original.sensor_pod_id) {
        //Tripper
        type = WINK.DEVICE_TYPE.TRIPPER;
        device = new Wink.Tripper(original);
    }
    if (original.smoke_detector_id) {
        //Smoke detector
        type = WINK.DEVICE_TYPE.SMOKE_DETECTOR;
    }
    if (original.thermostat_id) {
        //Thermostat
        type = WINK.DEVICE_TYPE.THERMOSTAT;
        device = new Wink.Thermostat(original);
    }
    if (!type) {
        //Type unknown
        console.log("Unrecognized device.  Please send the following info to the author.");
        console.log(original);
    }

    //return original;
    return device;
};

Wink.prototype.getDevices = function() {
    var res, rej;
    var p = new Promise(function (r, j) { res = r; rej = j;});
    var self = this;

    winkCall.call(this, "GET", URL.DEVICES, "").then(function(body) {
        if (body.data.error) {
            isConnected = false;
            rej("Cannot connect to API. " + body.data.error);
        } else {
            res(body.data);
        }
    });

    return p;
};

Wink.prototype.getDeviceByName = function (name) {
    for (var i = 0; i < this.devices.length; i++) {
        if (this.devices[i].name === name ) {
            break;
        }
    }

    if (i == this.devices.length) {
        this.log("Could not find a matching device " + name);
        return false;
    }

    return this.devices[i];
};

Wink.prototype.getDevicesByType = function (type) {
    var devices = [];

    for (var i=0; i < this.devices.length; i++) {
        if (this.devices[i].type === type) {
            devices.push(this.devices[i]);
        }
    }

    return devices;
};

var winkCall = function(method, url, body) {
    var p = new Promise(function(r1, r2) {res = r1; rej = r2;});
    var self = this;

    if (isConnected === false && url !== AUTH_URL) {
        rej("Cannot perform call when not connected.");
    }
    //if (url !== AUTH_URL) console.log(connectionTokens.access_token);
    var headers = {};
    headers["Content-Type"] = "application/json"; // "application/" + ((url === AUTH_URL) ? "x-www-form-urlencoded" : "json");
    headers.Authorization = (url === AUTH_URL) ? undefined : "Bearer " + connectionTokens.access_token;

    request({
        method: method,
        uri: WINK_API_BASE_URL + url,
        headers: headers,
        body: body
    }, function(error, response, body) {
        debugger;
        if (error) {
            rej(error);
        } else {
            res(JSON.parse(body));
        }
    });

    return p;
};

var Light = function (data) {
    this.name = data.name;
    this.id = data.light_bulb_id;
    this._data = data;
    this.type = WINK.DEVICE_TYPE.LIGHT;
};

Light.prototype.refresh = function () {
    var url = URL.REFRESH.replace("{device_type}", this.type).replace("{device_id}", this.id);
    return winkCall("GET", url, "");
};

Light.prototype.getName = function() {
    return this.name;
};

Light.prototype.on = function() {
    var url = URL.UPDATE.replace("{device_type}", this.type).replace("{device_id}", this.id);
    var data = this._data;
    data.desired_state = {powered: true, brightness: 0.99};
    var self = this;
    return winkCall.call(this.parent, "PUT", url, JSON.stringify(data)).then(function() {self.refresh();});
};

Light.prototype.off = function() {
    var url = URL.UPDATE.replace("{device_type}", this.type).replace("{device_id}", this.id);
    var data = this._data;
    data.desired_state = {powered: false, brightness: 0};
    var self = this;
    return winkCall.call(this.parent, "PUT", url, JSON.stringify(data)).then(function() {self.refresh();});
};

Light.prototype.dim = function(intensity) {
    if (intensity > 1) {
        //Probably a percentage
        intensity /= 100;
    }
    var url = URL.UPDATE.replace("{device_type}", this.type).replace("{device_id}", this.id);
    var data = this._data;
    data.desired_state = {powered: true, brightness: intensity};
    var self = this;
    return winkCall.call(this.parent, "PUT", url, JSON.stringify(data)).then(function() {self.refresh();});
};

Light.prototype.getBrightness = function() {
    var lastReading = this._data.last_reading;
    var brightness = 0;
    if (lastReading.powered) {
        brightness = this._data.last_reading.brightness;
    }

    return brightness;
};

var Tripper = function (data) {
    this.name = data.name;
    this.id = data.sensor_pod_id;
    this._data = data;
    this.type = WINK.DEVICE_TYPE.TRIPPER;
};

Tripper.prototype.refresh = function () {
    var url = URL.REFRESH.replace("{device_type}", this.type).replace("{device_id}", this.id);
    return winkCall("GET", url, "");
};

Tripper.prototype.isCurrentlyOpened = function() {
    return self._data.last_reading.opened;
};

var Lock = function (data) {
    this.name = data.name;
    this.id = data.lock_id;
    this._data = data;
    this.type = WINK.DEVICE_TYPE.LOCK;
};

Lock.prototype.refresh = function() {
    var url = URL.REFRESH.replace("{device_type}", this.type).replace("{device_id}", this.id);
    return winkCall("GET", url, "");
};

Lock.prototype._lockAction = function(newState, object) {
    var url = URL.UPDATE.replace("{device_type}", this.type).replace("{device_id}", this.id);
    var data = this._data;
    data.desired_state = {locked: newState};
    var self = this;
    return winkCall.call(this.parent, "PUT", url, JSON.stringify(data)).then(function() {self.refresh();});
};

Lock.prototype.lock = function() {
    var url = URL.UPDATE.replace("{device_type}", this.type).replace("{device_id}", this.id);
    var data = this._data;
    data.desired_state = {locked: true};
    var self = this;
    return winkCall.call(this.parent, "PUT", url, JSON.stringify(data)).then(function() {self.refresh();});
};

Lock.prototype.unlock = function() {
    var url = URL.UPDATE.replace("{device_type}", this.type).replace("{device_id}", this.id);
    var data = this._data;
    data.desired_state = {locked: false};
    var self = this;
    return winkCall.call(this.parent, "PUT", url, JSON.stringify(data)).then(function() {self.refresh();});
};

Lock.prototype.isLocked = function() {
    return self._data.last_reading.locked;
};

var Thermostat = function (data) {
    this.name = data.name;
    this.id = data.lock_id;
    this._data = data;
    this.type = WINK.DEVICE_TYPE.THERMOSTAT;
    this.units = {
        CELSIUS: "c",
        FAHRENHEIT: "f"
    };
};

Thermostat.prototype.refresh = function() {
    var url = URL.REFRESH.replace("{device_type}", this.type).replace("{device_id}", this.id);
    return winkCall("GET", url, "");
};

Thermostat.prototype.convertTemperature = function(temperature, from, to) {
    var convertedTemperature = temperature;
    if (from === this.units.CELSIUS && to === this.units.FAHRENHEIT) {
        convertedTemperature = (temperature * (9/5)) + 32;
    }
    if (from === this.units.FAHRENHEIT && to === this.units.CELSIUS) {
        convertedTemperature = (temperature - 32) * 5/9;
    }

    return convertedTemperature;
};

Thermostat.prototype.getTemperature = function(unit) {
    var temperature = this._data.last_reading.temperature;
    var deviceUnit = this._data.last_reading.units;
    if (typeof unit === "undefined") unit = deviceUnit;
    temperature = this.convertTemperature(temperature, deviceUnit, unit);
    return temperature;
};


Wink.Light = Light;
Wink.Tripper = Tripper;
Wink.Lock = Lock;
Wink.Thermostat = Thermostat;



module.exports = Wink;