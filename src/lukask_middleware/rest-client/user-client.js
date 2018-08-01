var restUrl = require('./../config/rest-api-url');

var Client = require("node-rest-client").Client;
////////////////// MULTIPART/FORM-DATA REQUESTS /////////////////////

var request = require('request');
////////////////////// FILE MANAGER ////////////////////////

var fs = require("fs");
////////////////////////////////////////////////////////////

var getUserProfile = function (userId, token, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();

    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var get = client.get(restUrl.user + userId + "/", args, function (data, response) {
        console.log(data);
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err);
    });
    ////

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

var getUserSupporters = function (relevanceType, comRelevance, limit, offset, token, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();
    var typeRelFilter = (comRelevance) ? "?usrRelCom=" + relevanceType : "?usrRelPub=" + relevanceType;
    var limitFilter = (limit) ? "&limit=" + limit : "";
    var offsetFilter = (offset) ? "&offset=" + offset : "";

    var queryFilter = typeRelFilter + limitFilter + offsetFilter;
    var nextPattern;

    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var get = client.get(restUrl.user + queryFilter + "/", args, function (data, response) {
        if (data.next) {
            nextPattern = "&" + data.next.substring(data.next.indexOf("limit="), data.next.indexOf("&", data.next.indexOf("limit=")));
            nextPattern += "&" + data.next.substring(data.next.indexOf("offset="));
            data.next = nextPattern;
        }
        console.log(data);
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err);
    });
    ////

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

var patchUser = function (userId, body, file, token, callback) {
    ////////////////////////////////// POST REQUEST //////////////////////////////////////
    var r = request.patch(
        {
            url: restUrl.user + userId + "/",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Token " + token
            }
        }, function optionalCallback(err, httpResponse, data) {
            if (err) {
                console.log('Error while making todo post request: ', err);
                callback(httpResponse.statusCode, err);
            }
            if (httpResponse.statusCode == 200) {
                if (file) {
                    console.log("Elimando archivo: " + file.path);
                    fs.unlink(file.path);
                }
                console.log('User has been updted successfully, Server responded with: ', JSON.parse(data));
                callback(httpResponse.statusCode, JSON.parse(data));
            }
            else {
                console.log('Error while making user patch request: ', data);
                callback(httpResponse.statusCode, data);
            }
        });

    var form = r.form();

    form.append('id', body.id);
    form.append('email', body.email);
    form.append('person.age', body.age);
    form.append('person.identification_card', body.identification_card);
    form.append('person.name', body.name);
    form.append('person.last_name', body.last_name);
    form.append('person.telephone', body.telephone);
    form.append('person.address', body.address);
    form.append('is_active', body.is_active);

    if (file) {
        form.append("media_profile", fs.createReadStream(file.path), { filename: file.originalname, contentType: file.mimetype });
    }
    //////////////////////////////////////////////////////////////////////////////////////
}

module.exports = {
    getUserProfile: getUserProfile,
    getUserSupporters: getUserSupporters,
    patchUser: patchUser
}