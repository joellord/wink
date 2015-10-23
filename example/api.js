var Wink = require("wink");

var wink = new Wink({
  //Credentials
});

wink.on("ready", function(devices) {
  var garageLightBack = new wink.Light("deviceName");
  garageLightBack.on();
  garageLightBack.off();
  garageLightBack.dim(85);

  var doorSensor = new wink.Trapper("deviceName");
  var currentDoorState = doorSensor.state();

  var thermostat = new wink.Thermostat("deviceName");
  var currentTemp = thermostat.temperature("c");
  thermostat.set(24, "c");
  thermostat.away();
  thermostat.home();

  var smokeDetectorHallway = new wink.SmokeDetector("deviceName");
  var batteryStatus = smokeDetectorHallway.batteryStatus();
  var coLevel = smokeDetectorHallway.coLevel();
  var smokeLevel = smokeDetectorHallway.smokeLevel();

  var frontDoorLock = new wink.Lock("deviceName");
  var currentLockState = frontDoorLock.state();
  frontDoorLock.lock();
  frontDoorLock.unlock();

  var eggMinder = new wink.EggMinder("deviceName");
  var eggs = eggMinder.eggs();
});