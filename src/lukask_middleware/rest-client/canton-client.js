var restUrl = require('./../config/rest-api-url');
var Client = require("node-rest-client").Client;

var getCanton = function (provincia_id, token, callback) {
    console.log("siiiii..................");
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();

    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var get = client.get(restUrl.province + provincia_id + "/", args, function (data, response) {
        console.log(data);
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err.code);
    });
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = {
    getCanton: getCanton,
}