var express = require('express');
var router = express.Router();

var actionRestClient = require('./../rest-client/action-client');
var actionTypes = require('./../const/action-types');

var request = require('request');

var wepushClient = require('./../rest-client/webpush-client');

router.post('/', function (req, res, next) {
  let token = req.session.key.token;
  let relevanceType = actionTypes.relevant;
  req.body.action_type = relevanceType;

  console.log(req.body);
  actionRestClient.postAction(req.body, null, token, function (responseCode, data) {
    if (responseCode == 201 || responseCode == 200) {
      wepushClient.notify('Nuevo apoyo registrado', "Un me gusta", '/inicio', function (resCode, relevanceData) {
        console.log(resCode, relevanceData);
      });

      return res.status(responseCode).json({
        code: responseCode,
        title: "Action has been created successfully",
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
