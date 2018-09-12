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

var getPubFilter = function (token, cityFilter, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();
    var filter = "?search=" + cityFilter;
    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var get = client.get(restUrl.pub + filter, args, function (data, response) {
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err.code);
    });
    ////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

var getPubByPage = function (token, limit, offset, userId, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();
    limit = ((limit) ? "?limit=" + limit : "");
    offset = ((offset) ? "&offset=" + offset : "");
    userId = ((userId) ? "&pubUserQr=" + userId : "");
    var filter = limit + offset + userId;

    var get;

    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    get = client.get(restUrl.pub + filter, args, function (data, response) {
        if (data.next) {
            data.next = data.next.substring(data.next.indexOf("?"));
        }
        console.log(data);
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err.code);
    });
    ////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
}

var postPub = function (body, mediaArray, token, callback) {
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
    form.append('location', body.location);
    form.append('address', body.address);
    form.append('is_trans', body.is_trans);

    if (mediaArray) {
        for (var i = 0; i < mediaArray.length; i++) {
            form.append('medios_data[' + i + ']format_multimedia', mediaArray[i].mediaType);
            form.append('medios_data[' + i + ']name_file', mediaArray[i].mediaName);
            form.append('medios_data[' + i + ']description_file', body.detail);
            form.append('medios_data[' + i + ']media_path', mediaArray[i].mediaPath);
        }
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

var patchPub = function (body, files, token, callback) {
    ////////////////////////////////// POST REQUEST //////////////////////////////////////
    var r = request.patch(
        {

            url: restUrl.pub + body.pubId + "/",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Token " + token
            }
        }, function optionalCallback(err, httpResponse, data) {
            if (err) {
                console.log('Error while making todo patch request: ', err);
                callback(httpResponse.statusCode, err);
            }
            if (httpResponse.statusCode == 200) {
                if (files) {
                    for (var i = 0; i < files.length; i++) {
                        console.log("Elimando archivo: " + files[i].path);
                        fs.unlink(files[i].path);
                    }
                }
                console.log('Publication has been patched successfully, Server responded with: ', JSON.parse(data));
                callback(httpResponse.statusCode, JSON.parse(data));
            }
            else {
                console.log('Error while making todo patch request: ', data);
                callback(httpResponse.statusCode, data);
            }
        });

    var form = r.form();
    if (body.latitude) {
        form.append('latitude', body.latitude);
    }
    if (body.longitude) {
        form.append('length', body.longitude);
    }
    if (body.detail) {
        form.append('detail', body.detail);
    }
    if (body.date_publication) {
        form.append('date_publication', body.date_publication);
    }
    if (body.type_publication) {
        form.append('type_publication', body.type_publication);
    }
    if (body.location) {
        form.append('location', body.location);
    }
    if (body.address) {
        form.append('address', body.address);
    }
    if (body.is_trans) {
        form.append('is_trans', body.is_trans + "");
    }
    if (body.stopTrans) {
        form.append('trans_done', body.stopTrans + "");
    }

    if (files) {
        for (var i = 0; i < files.length; i++) {
            form.append('medios_data[' + i + ']format_multimedia', (files[0].mimetype.indexOf("image") != -1) ? "IG" : "FL");
            form.append('medios_data[' + i + ']name_file', files[i].originalname);
            form.append('medios_data[' + i + ']description_file', body.detail);
            form.append('medios_data[' + i + ']media_file', fs.createReadStream(files[i].path), { filename: files[i].originalname, contentType: files[i].mimetype });
        }
    }
    //////////////////////////////////////////////////////////////////////////////////////
}

/*var deleteTodo = function (todoId, token, callback) {
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
    getPubFilter: getPubFilter,
    getPubByPage: getPubByPage,
    postPub: postPub,
    getPub: getPub,
    patchPub: patchPub,
    /*patchTodo: patchTodo,
    deleteTodo: deleteTodo*/
}