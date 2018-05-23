var express = require('express');
var router = express.Router();
var cryptoGen = require('./../tools/crypto-generator');

/* REST API CLIENT - LOGIN METHOD */
router.post('/', function(req, res, next) {
    var loginClient = require('./../rest-client/login-client');
  
    let user = cryptoGen.decryptPass(req.body.username);
    let password = cryptoGen.decryptPass(req.body.password);
    
    loginClient.responseLogin(user, password, function(responseCode, data){
      console.log("Login REST API method has returned next data");
      console.log(data);
      if(responseCode == 200) {
        //GENERATING CRYPTO ID FOR USER SESSION:
        let encrypted = cryptoGen.encrypt(user + "-" + Date.now());
        ///////////////////////////////////////
  
        //CALLING TO OUR SESSION STORE INSTANCE:
        req.session.key = {
          crypto_user_id: encrypted,
          token: data.token
        };
        ////////////////////////////////////////
        return res.status(responseCode).json({
          code: responseCode,
          title: "Successfully calling of login REST API method",
          data: {
            user_id: encrypted,
            email: user
          }
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