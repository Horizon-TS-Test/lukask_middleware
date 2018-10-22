var express = require('express');
var router = express.Router();
var publicationRestClient = require('./../rest-client/publication-client');
var servers = require("../config/servers");

/////////////////////// FILE UPLOAD ////////////////////////
const pubMediaDest = 'public/images/pubs';
//REF: https://www.npmjs.com/package/multer
var multer = require("multer");
var storage = multer.diskStorage(
  {
    destination: function (req, file, cb) {
      cb(null, pubMediaDest)
    },
    filename: function (req, file, cb) {
      cb(null, req.body.userId + '-' + Date.now() + ".png")
    }
  }
);
var upload = multer({ storage: storage });
////////////////////////////////////////////////////////////

var wepushClient = require('./../rest-client/webpush-client');

/*router.get('/', function (req, res, next) {
  let userId = 1;
  let token = req.session.key.token;

  publicationRestClient.getPubs(userId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of publication data",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});*/

/**********************************************
 * Inicalización de webSocket temporal
 **********************************************/
//////////////////////////////////////////////////////////////////////////////////
var WebSocket = require('ws');
var ws = new WebSocket('ws://' + servers.backend_websocket + '/lukask-api');
//////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/filter/:city', function (req, res, next) {
  let cityFilter = req.params.city;
  let token = req.session.key.token;

  publicationRestClient.getPubFilter(token, cityFilter, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of publication data with filter",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

router.get('/', function (req, res, next) {
  let token = req.session.key.token;
  let limit = isNaN(parseInt(req.query.limit)) ? null : req.query.limit;
  let offset = (req.query.offset) ? req.query.offset : null;
  let userId = (req.query.user_id) ? req.query.user_id : null;

  publicationRestClient.getPubByPage(token, limit, offset, userId, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of publication data with pagination",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

router.post('/', upload.array('media_files[]', 5), (req, res, next) => {
  let token = req.session.key.token;
  let dest, mediaArray = [];

  if (req.files && req.files.length > 0) {
    //REF: https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express
    //serverUrl = req.protocol + '://' + req.get('host');

    for (var i = 0; i < req.files.length; i++) {
      dest = req.files[i].path;
      dest = dest.replace("public/", "");

      mediaArray[mediaArray.length] = {
        mediaType: req.files[i].mimetype.indexOf("image") != -1 ? "IG" : "FL",
        mediaPath: "/" + dest,
        mediaName: dest.substring(dest.indexOf("/", dest.indexOf("pubs/")))
      };
    }
  }
  else {
    mediaArray[mediaArray.length] = {
      mediaType: "IG",
      mediaPath: "/images/default.jpg",
      mediaName: "default.jpg"
    };
  }

   var latitud = req.body.latitude;
  var longitud = req.body.longitude;

  var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: 'AIzaSyDIjRFZ0hnXtYFoK1uvIHnvQIKoQwkzgUU',
    formatter: null
  };

  var geocoder = NodeGeocoder(options);
  var Local = {
    lat: latitud,
    lon: longitud
  };
  var location = "";
  let obteniendoCiudad = new Promise((resolve, reject) => {
    geocoder.reverse(Local, (err, res) => {
      if (err) {
        console.log("Error" + err);
      }
      location = res[0].city;
      resolve("exito");
    });
  });

  obteniendoCiudad.then((successMessage) => {
    publicationRestClient.getPubFilter(token, location, function (responseCode, data) {
      if (responseCode == 200) {
        var lista = data.results;
        var respuesta = determinePosition(location, lista, latitud, longitud, token);
        //Verdadero si se puede crear, Falso no se puede crear el registro
        if (respuesta) {
          publicationRestClient.postPub(req.body, mediaArray, token, (responseCode, data) => {
            if (responseCode == 201) {
              /*let title = 'Nueva publicación registrada';
              let content = (req.body.detail.length > 100) ? req.body.detail.substring(0, 100) : req.body.detail;
              let defaultUrl = '/';
              let queryParam = data.id_publication;
              let actions = [
                {
                  action: '/?pubId=' + queryParam,
                  title: 'Ver Pubswall'
                },
                {
                  action: '/mapview?pubId=' + queryParam,
                  title: 'Ver Mapa'
                },
              ]
              wepushClient.notify(title, content, defaultUrl, actions, function (resCode, notifData) {
                console.log(resCode, notifData);
              });*/

              var msg = {
                stream: "publication",
                payload: {
                  action: "custom_create",
                  pk: data.id_publication,
                  data: {
                  }
                }
              }
              ws.send(JSON.stringify(msg));

              ws.onmessage = function (message) {
                // SOCKET.IO CLIENTS LOGGED CONTROL:
                //REF: https://stackoverflow.com/questions/35249770/how-to-get-all-the-sockets-connected-to-socket-io
                Object.keys(req.io.sockets.sockets).forEach(function (id) {
                  console.log("FROM PUB: Sending data to socket with ID: ", id)  // socketId
                  if (req.io.sockets.connected[id].request.session.key) {
                    //REF: https://stackoverflow.com/questions/8281382/socket-send-outside-of-io-sockets-on
                    req.io.sockets.connected[id].emit("backend-rules", JSON.parse(message.data));
                  }
                })
                ////
              }

              return res.status(responseCode).json({
                code: responseCode,
                title: "Publication has been created successfully",
                data: data
              });
            }
            return res.status(responseCode).json({
              code: responseCode,
              title: "An error has occurred",
              error: data
            });
          });
          } else {
          console.log("No se puede false" + respuesta);
          return res.status(responseCode).json({
            code: 400,
            showFront: true,
            title: "An error has occurred",
            error: "Posicion no permitida"
          });
        }
      }
    });
  });
});


/**
 * Funcion que determina si la distancia es o no menor a un criterio en este caso menor a 10mtr
 * @param {Ciudad } location 
 * @param {Lista de publicaciones } lista 
 * @param {Latitud de la posicion que va a ser registrada } latitud 
 * @param {Longitud de la posicion que va a ser registrada} longitud 
 * @param {Clave de sesion } token 
 */
function determinePosition(location, lista, latitud, longitud, token) {
  for (let dato in lista) {
    var distancia = getDistanceToCoords(latitud, longitud, lista[dato].latitude, lista[dato].length);
    if (distancia < 5) {
      return false;
    }
  }
  return true;
}


/**
 * Funcion que calcula la distancia de dos puntos dado su latitud y longitud
 * @param {Latitud posicion uno} lat1 
 * @param {Longitud posicion uno} lon1 
 * @param {Latitud posicion dos} lat2 
 * @param {Longitud posicion dos} lon2 
 */
function getDistanceToCoords(lat1, lon1, lat2, lon2) {
  function _deg2rad(deg) {
    return deg * (Math.PI / 180)
  }
  var R = 6371; // Radius of the earth in km 3963.191 in milles
  var dLat = _deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = _deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(_deg2rad(lat1)) * Math.cos(_deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  d = d * 1000;
  console.log(d, "mt");
  return d.toFixed(3);
}


router.get('/:pubId', function (req, res, next) {
  let pubId = req.params.pubId;
  let token = req.session.key.token;

  publicationRestClient.getPub(pubId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving pub detail",
        pub: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

router.post('/transmission/:pubId', function (req, res, next) {
  let pubId = req.params.pubId;
  let token = req.session.key.token;

  publicationRestClient.patchPub(req.body, null, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Transmission has been created stopped successfully",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

/*router.get('/delete/:todoId', function (req, res, next) {
  let todoId = req.params.todoId;
  let token = req.session.key.token;

  publicationRestClient.deleteTodo(todoId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Todo has been deleted successfully",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});*/

module.exports = router;
