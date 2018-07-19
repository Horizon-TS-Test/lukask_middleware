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
    form.append('person.cell_phone', body.cell_phone);
    form.append('person.birthdate', body.birthdate);
    form.append('person.province', body.province);
    form.append('person.canton', body.canton);
    form.append('person.parroquia', body.parroquia);
    form.append('is_active', body.is_active);

    if (file) {
        form.append("media_profile", fs.createReadStream(file.path), { filename: file.originalname, contentType: file.mimetype });
    }
    //////////////////////////////////////////////////////////////////////////////////////
}


var postUser = function (body, file, token, callback) {
    ////////////////////////////////// POST REQUEST //////////////////////////////////////
    var r = request.post(
        {
            url: restUrl.user,
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
    //form.append('id', body.id);
    form.append('email', body.email);
    form.append('password', body.password);
    form.append('person.age', body.age + "");
    form.append('person.identification_card', body.identification_card);
    form.append('person.name', body.name);
    form.append('person.last_name', body.last_name);
    form.append('person.telephone', body.telephone);
    form.append('person.cell_phone', body.cell_phone);
    form.append('person.address', body.address);
    form.append('person.birthdate', body.birthdate);
    form.append('person.parish', body.parroquia);

    form.append('is_active', "true");
    /**/

    if (file) {
        form.append("media_profile", fs.createReadStream(file.path), { filename: file.originalname, contentType: file.mimetype });
    }
    //////////////////////////////////////////////////////////////////////////////////////
}


module.exports = {
    getUserProfile,
    patchUser: patchUser,
    postUser: postUser,
}