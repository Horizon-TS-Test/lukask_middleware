var restUrl = require('./../config/rest-api-url');

var Client = require("node-rest-client").Client;

////////////////// MULTIPART/FORM-DATA REQUESTS /////////////////////
var request = require('request');
/////////////////////////////////////////////////////////////////////

////////////////////// FILE MANAGER ////////////////////////
var fs = require("fs");
////////////////////////////////////////////////////////////

var getPubs = function (userId, token, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();

    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var get = client.get(restUrl.pub, args, function (data, response) {
        //console.log(data);
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err);
    });
    ////

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

var postPub = function (body, files, token, callback) {
    ////////////////////////////////// POST REQUEST //////////////////////////////////////
    var r = request.post(
        {
            url: restUrl.pub,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Token " + token
            }
        }, function optionalCallback(err, httpResponse, data) {
            if (err) {
                console.log('Error while making todo post request: ', err);
                callback(httpResponse.statusCode, err);
            }
            if (httpResponse.statusCode == 201) {
                if (files) {
                    for (var i = 0; i < files.length; i++) {
                        console.log("Elimando archivo: " + files[i].path);
                        fs.unlink(files[i].path);
                    }
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
    form.append('latitude', body.latitude);
    form.append('length', body.longitude);
    form.append('detail', body.detail);
    form.append('date_publication', body.date_publication);
    form.append('type_publication', body.type_publication);

    for (var i = 0; i < files.length; i++) {
        form.append('medios_data[' + i + ']format_multimedia', (files[0].mimetype.indexOf("image") != -1) ? "IG" : "FL");
        form.append('medios_data[' + i + ']name_file', files[i].originalname);
        form.append('medios_data[' + i + ']description_file', body.detail);
        form.append('medios_data[' + i + ']media_file', fs.createReadStream(files[i].path), { filename: files[i].originalname, contentType: files[i].mimetype });
    }
    //////////////////////////////////////////////////////////////////////////////////////
}

var getPub = function (id, token, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();

    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var get = client.get(restUrl.pub + id + "/", args, function (data, response) {
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

/*var patchTodo = function (todoId, todoData, token, callback) {
    ////////////////////////////////// POST REQUEST //////////////////////////////////////
    request.patch({
        url: restUrl.todo + todoId + "/",
        formData: todoData,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Token " + token
        }
    }, function optionalCallback(err, httpResponse, data) {
        if (err) {
            console.log('Error while making todo patch request: ', err);
            callback(httpResponse.statusCode, err);
        }
        console.log('Todo has been updated successfully, Server responded with: ', data);
        callback(httpResponse.statusCode, data.todo_id);
    });
    //////////////////////////////////////////////////////////////////////////////////////
}

var deleteTodo = function (todoId, token, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    let client = new Client();

    //DELETE METHOD:
    let args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    let del = client.delete(restUrl.todo + todoId + "/", args, function (data, response) {
        console.log(data);
        callback(response.statusCode, data);
    });

    del.on("error", function (err) {
        console.log(err);
        callback(500, err.code);
    });
    ////

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}*/

module.exports = {
    getPubs: getPubs,
    postPub: postPub,
    getPub: getPub,
    /*patchTodo: patchTodo,
    deleteTodo: deleteTodo*/
}