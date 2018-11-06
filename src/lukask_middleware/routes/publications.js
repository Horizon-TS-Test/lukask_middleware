var express = require('express');
var router = express.Router();
var publicationRestClient = require('./../rest-client/publication-client');
var servers = require("../config/servers");
var pv = require("../tools/position-validator");
var NodeGeocoder = require('node-geocoder');

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
  console.log("Entre!!!");
  var geocoder = NodeGeocoder(options);
  
  var Local = {lat: latitud,lon: longitud};
  var location = "";
  
  let obteniendoCiudad = new Promise((resolve, reject) => {
    geocoder.reverse(Local, (err, res) => {
      if (err) {
        console.log("Error" + err);
      }
      location = res[0].city;
      console.log("Ciudad");
      console.log(location);
      resolve("exito");
    });
  });

  obteniendoCiudad.then((successMessage) => {
    console.log("Vamos a publicar!!");
    publicationRestClient.getPubFilter(token, location, function (responseCode, data) {
      if (responseCode == 200) {
        var lista = data.results;
        var respuesta = pv.determinePosition(location, lista, latitud, longitud, token);
        //Verdadero si se puede crear, Falso no se puede crear el registro
        console.log("respuesta");
        console.log(respuesta);
        if (respuesta) {
          console.log("Se inserto...");
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
