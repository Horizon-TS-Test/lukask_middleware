var webpush = require('./../config/push-api');
var Client = require("node-rest-client").Client;

var notify = function (receivers, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();

    //POST METHOD:
    var args = {
        data: {
            "receivers": receivers
        },
        headers: {
            "Content-Type": "application/json",
        }
    }

    var post = client.post(webpush.webpush_url, args, function (data, response) {
        callback(response.statusCode, data);
    });

    post.on("error", function (err) {
        callback(500, err.code);
    });
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = {
    notify: notify
}