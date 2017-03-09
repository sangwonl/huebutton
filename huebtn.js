var DashButton = require("node-dash-button");
var hue = require("node-hue-api");

var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');

var dateFormat = require('dateformat');

var HueApi = hue.HueApi;
var lightState = hue.lightState;

var hostname = "<hue-bridge-ip>";
var username = "<hue-bridge-api-username>";

var api = new HueApi(hostname, username);
var state = lightState.create();

var doc = new GoogleSpreadsheet('<credential-private-key-id>');

var logToSheet = function(action) {
    doc.useServiceAccountAuth(creds, function () {
        doc.getInfo(function(err, info) {
            var now = dateFormat(new Date(), 'yyyy-mm-dd hh:MM:ss');
            var sheet = info.worksheets[0];
            sheet.addRow({ seq: sheet.rowCount, time: now, action: action })
        });
    });
};

var dash = DashButton("<aws-iot-button-mac-address>", null, null, 'all');
dash.on("detected", function() {
    var lightId = 3;
    api.lightStatus(lightId)
    .then(function(status) {
        var newStatus = status.state.on ? state.off() : state.on();
        api.setLightState(lightId, newStatus)
        .then(function(result) {
            logToSheet(newStatus._values.on ? 'ON' : 'OFF');
        })
        .fail(function(error) { console.log(error); })
        .done();
    }).done();
});
