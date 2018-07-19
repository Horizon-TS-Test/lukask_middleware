var express = require('express');
var router = express.Router();
var paymentRestClient = require('./../rest-client/payments-client');

//Get del Exitoso
router.get('/exitoso', function (req, res, next) {
  var parametros ={
     params:{
       "paymentId":req.query.paymentId,
       "PayerID":req.query.PayerID
     }
  };
   var token = req.session.key.token;
  paymentRestClient.getExitoso(parametros,token,function (responseCode, data) {
     if (responseCode == 200) {
      return  res.redirect('http://127.0.0.1:4200/pagos');
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

//Get del Cancelado
router.get('/cancelado', function (req, res, next) {
  let body = req.body;
  let token = req.session.key.token;
  paymentRestClient.getCancelado(body,token,function (responseCode, data) {
    if (responseCode == 200) {
      return res.redirect('http://127.0.0.1:4200/pagos');
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

//Post del Pago
router.post('/pay', function (req, res, next) {
  var token = req.session.key.token;
  paymentRestClient.postPay(req.body, token, function (responseCode, data) {
     if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Sus datos successfully",
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

//Post de la Tarjeta
router.post('/card', function (req, res, next) {
  //Debe ingresar las fechas y los datos de la tarjeta
  var token = req.session.key.token;
  paymentRestClient.postCards(req.body, token, function (responseCode, data) {
     if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Sus datos successfully",
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