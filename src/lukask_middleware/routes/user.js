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

module.exports = router;
