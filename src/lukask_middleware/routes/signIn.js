var express = require('express');
var router = express.Router();

var userRestClient = require('./../rest-client/user-client');
/////////////////////// FILE UPLOAD ////////////////////////
var multer = require("multer");
var upload = multer({ dest: 'tmp_uploads/' });

/**
 * MÉTODO PARA REGISTRAR UN USUARIO
 */
router.post('/', upload.single('user_file'), function (req, res, next) {
  let token = req.session.key.token;
  console.log("Post cliente");
  console.log(req.body);

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
