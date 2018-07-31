var express = require('express');
var router = express.Router();

var userRestClient = require('./../rest-client/user-client');
/////////////////////// FILE UPLOAD ////////////////////////
var multer = require("multer");
var upload = multer({ dest: 'tmp_uploads/' });

router.get('/:user_id', function (req, res, next) {
  let userId = req.params.user_id;
  let token = req.session.key.token;

  userRestClient.getUserProfile(userId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of user profile",
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

/**
 * MÉTODO PARA ACTUALIZAR LOS DATOS DE PERFIL
 */
router.post('/:user_id', upload.single('user_file'), function (req, res, next) {
  let token = req.session.key.token;
  let user_id = req.params.user_id;

  userRestClient.patchUser(user_id, req.body, req.file, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "User has been updated successfully",
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

/**
 * MÉTODO PARA REGISTRAR UN USUARIO
 */
router.post('/', upload.single('user_file'), function (req, res, next) {
  let token = req.session.key.token;
  /*console.log("Erroes de middle ware......................");
  console.log(req.body);*/
  userRestClient.postUser(req.body, req.file, token, function (responseCode, data) {
    if (responseCode == 201) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "User has been updated successfully",
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
  if (!req.query.pub_id && !req.query.com_id) {
    return res.status(400).json({
      code: responseCode,
      title: "An error has ocurred",
      error: "A pub id or comment id must be provided"
    });
  }
  let relevanceType = (req.query.pub_id) ? req.query.pub_id : req.query.com_id;
  let comRelevance = (req.query.com_relevance) ? req.query.com_relevance : false;
  let limit = (req.query.limit) ? req.query.limit : null;
  let offset = (req.query.offset) ? req.query.offset : null;
  let token = req.session.key.token;

  userRestClient.getUserSupporters(relevanceType, comRelevance, limit, offset, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of supporter users",
        supporters: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

router.post('/:user_id', upload.single('user_file'), function (req, res, next) {
  let token = req.session.key.token;
  let user_id = req.params.user_id;

  userRestClient.patchUser(user_id, req.body, req.file, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "User has been updated successfully",
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

module.exports = router;
