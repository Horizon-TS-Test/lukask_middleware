var restUrl = require('./../config/rest-api-url');

var Client = require("node-rest-client").Client;
////////////////// MULTIPART/FORM-DATA REQUESTS /////////////////////

var request = require('request');
////////////////////// FILE MANAGER ////////////////////////

var fs = require("fs");
////////////////////////////////////////////////////////////

var postUser = function (user_id, body, file, token, callback) {
    ////////////////////////////////// POST REQUEST //////////////////////////////////////
    var r = request.patch(
        {
            url: restUrl.user + user_id + "/",
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
                    console.log("Elimando archivo: " + file[i].path);
                    fs.unlink(file.path);
                }
                console.log('Publication has been created successfully, Server responded with: ', JSON.parse(data));
                callback(httpResponse.statusCode, JSON.parse(data));
            }
            else {
                console.log('Error while making todo post request: ', data);
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
    postUser: postUser,
}