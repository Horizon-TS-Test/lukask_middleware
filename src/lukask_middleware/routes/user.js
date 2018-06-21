var express = require('express');
var router = express.Router();

var userRestClient = require('./../rest-client/user-client');
/////////////////////// FILE UPLOAD ////////////////////////
var multer = require("multer");
var upload = multer({ dest: 'tmp_uploads/' });

var wepushClient = require('./../rest-client/webpush-client');

router.post('/:user_id',upload.single('user_file'), function (req, res, next) {
  let token = req.session.key.token;
  let user_id=req.params.user_id;

  userRestClient.postUser(user_id,req.body, req.file, token, function (responseCode, data) {
    if (responseCode == 200) {
      wepushClient.notify('Usuario modificado', req.body.detail, '/inicio', function (resCode, notifData) {
        console.log(resCode, notifData);
      });

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

});

module.exports = router;
