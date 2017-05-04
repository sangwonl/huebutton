// AWS for SQS
const SQSConsumer = require("sqs-consumer");
const AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-northeast-2",
  accessKeyId: "<aws-access-key>",
  secretAccessKey: "<aws-secret-key>"
});

// Hue Bridge
const hue = require("node-hue-api");
const hostname = "<hue-bridge-ip>";
const username = "<hue-bridge-api-username>";
const api = new hue.HueApi(hostname, username);

// Google Sheet
const GoogleSpreadsheet = require("google-spreadsheet");
const creds = require("./client_secret.json");
const doc = new GoogleSpreadsheet('<credential-private-key-id>');
const creds_json = { client_email: creds.client_email, private_key: creds.private_key };

// Misc.
const dateFormat = require("dateformat");

var logToSheet = function(action) {
    doc.useServiceAccountAuth(creds, function () {
        doc.getInfo(function(err, info) {
            var now = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
            var sheet = info.worksheets[0];
            sheet.addRow({ seq: sheet.rowCount, time: now, action: action });
            console.log("[HUEBTN] Logging to Google spreadsheet.");
        });
    });
};

const CLICK_SINGLE = "SINGLE";
const CLICK_DOUBLE = "DOUBLE";
const CLICK_LONG = "LONG";

const app = SQSConsumer.create({
    queueUrl: "https://sqs.ap-northeast-2.amazonaws.com/<generated-id>/<queue-name>",
    handleMessage: (message, done) => {
        const msgJson = JSON.parse(message.Body);
        const clickType = msgJson.clickType;
        console.log("[HUEBTN] AWS button clicked: " + clickType);

        var lightId = 3;
        api.lightStatus(lightId).then(function(status) {
            var action = "UNKNOWN";
            var newState = hue.lightState.create();
            if (clickType == CLICK_LONG) {
                action = "OFF";
                newState = newState.off();   
            } else {
                newState = newState.on();   
                if (clickType == CLICK_SINGLE) {
                    action = "ON (WARM)";
                    newState = newState.white(500, 100);
                } else {
                    action = "ON (WHITE)";
                    newState = newState.white(200, 100); 
                }
            }

            api.setLightState(lightId, newState).then(function(result) {
                console.log(`[HUEBTN] Light is turned ${action}.`);
                logToSheet(action);
            })
            .fail(function(error) { console.log(error); })
            .done();
        }).done();

        done();
    },
    sqs: new AWS.SQS()
});

app.on("error", (err) => {
    console.log(err.message);
});

app.start();