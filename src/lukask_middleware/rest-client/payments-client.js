var restUrl = require('./../config/rest-api-url');
var Planilla = require('./../models/panillas');
var Client = require("node-rest-client").Client;
//Post para el servicio

var Request = require("request");


//Listar Planillas
var getBills = function (callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();
    Planilla.find({}, function (err, docs) {
        var tamaño = docs.length;
        var planillaPedazo = [];
        var Pedazos = 1;
        //Crear la nueva matriz de los datos
        for (var i = 0; i < tamaño; i += Pedazos) {
            planillaPedazo.push(docs.slice(i));
            i = tamaño + Pedazos;
        }
    });
    console.log("datos de la planilla", planillaPedazo);

    var get = client.get(planillaPedazo, function (data, response) {
        //console.log(data);
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err);
    });
    ////

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
};

//Ruta si fue un exito
var getExitoso = function (body, token, callback) {
    ///////////////////////////////////////////NODE-REST-CLIENT///////////////////////////////////////
    var client = new Client();
    const payerId = body.query.PayerId;
    const paymentId = body.query.paymentId;
    var get;
    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    get = client.get(restUrl.checkout + '/checkout?paymentId=' + paymentId + '&token=' + token + '&PayerID=' + payerId + '', args, function (data, response) {
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
};


//POST PARA EL METODO DE RUBY
var postPay = function (body, token, callback) {
    //Cuerpo que vamos a enviar///////
    console.log("Bodyyyyyyyyy post pay", body);
    var create_payment_json = {
        "shopping_id": "",
        "total": 1 * 100,
        "items": [{
            "name": "Back End",
            "sku": "item",
            "price": 1,
            "currency": "USD",
            "quantity": 1
        }],
        "return_url": "http://localhost:3001/exitoso",
        "cancel_url": "http://localhost:3001/carrito"
    };
    /////////////////////////////////

    /////Ver los productos que tenemos a pagar//////
    var band = 0;
    var lista = req.session.cart.items;
    for (i in lista) {
        var item = {
            "name": lista[i].item.titulo,
            "sku": lista[i].item._id,
            "price": lista[i].item.precio,
            "currency": "USD",
            "quantity": lista[i].qty
        };
        create_payment_json.items[ban] = item;
        ban++;
    }
    ///////////////////////////////////////////////
    //Consumo del Post
    var pay = request.post({
        url: restUrl.pay,
        headers: {
            'Authorization': '[{"key":"Authorization","value":"' + token + '","description":""}]',
            "Content-Type": "application/json",
        },
        method: 'POST',
        data: JSON.stringify(create_payment_json)
    }, function optionalCallback(err, httpResponse, data) {
        if (err) {
            console.log('Error while making todo post request: ', err);
            callback(httpResponse.statusCode, err);
        }
        if (httpResponse.statusCode == 200) {
            console.log('Ingreso a la pagina de PayPal successfully, Server responded with: ', JSON.parse(data));
            callback(httpResponse.statusCode, JSON.parse(data));
        } else {
            console.log('Error while making todo post request: ', data);
            callback(httpResponse.statusCode, data);
        }
    });
    var form = pay.form();
    form.append('message', body.message);
    form.append('idpago', body.data.id);
    form.append('email', body.data.email);
    form.append('paypal_id', body.data.paypal_id);
    form.append('total', body.data.total);
    form.append('fecha', body.data.created_at);
    form.append('address', body.address);
};




//Tarjetas
var postCards = function (body, token, callback) {
    //Cuerpo que vamos a enviar///////
    console.log("Bodyyyyyyyyy post pay", body);
    //Creacion del cuerpo Json Para enviar
  var ban = 0;
  var create_card_json = {
    "shopping_id": "",
    "tarjeta": {
      "email": body.email,
      "number": body.card,
      "expire_month": mes,
      "expire_year": anio,
      "cvv2": req.body.cvv
    },
    "productos": {
      "total": req.session.cart.totalPrecio * 100,
      "items":
        [
          {
            "name": "Back End",
            "sku": "item",
            "price": 1,
            "currency": "USD",
            "quantity": 1
          }
        ],
      "return_url": "http://localhost:3001/exitoso",
      "cancel_url": "http://localhost:3001/carrito"
    }
  };

  var lista = req.session.cart.items;
  for (i in lista) {
    var item = {
      "name": lista[i].item.titulo,
      "sku": lista[i].item._id,
      "price": lista[i].item.precio,
      "currency": "USD",
      "quantity": lista[i].qty
    };
    create_card_json.productos.items[ban] = item;
    ban++;
  }
    ///////////////////////////////////////////////
    //Consumo del Post
    var pay = request.post({
        url: restUrl.checkout,
        headers: {
            'Authorization': '[{"key":"Authorization","value":"' + token + '","description":""}]',
            "Content-Type": "application/json",
        },
        method: 'POST',
        data: JSON.stringify(create_card_json)
    }, function optionalCallback(err, httpResponse, data) {
        if (err) {
            console.log('Error while making todo post request: ', err);
            callback(httpResponse.statusCode, err);
        }
        if (httpResponse.statusCode == 200) {
            console.log('Ingreso a la pagina de PayPal successfully, Server responded with: ', JSON.parse(data));
            callback(httpResponse.statusCode, JSON.parse(data));
        } else {
            console.log('Error while making todo post request: ', data);
            callback(httpResponse.statusCode, data);
        }
    });
    var form = pay.form();
    form.append('message', body.message);
    form.append('idpago', body.data.id);
    form.append('email', body.data.email);
    form.append('paypal_id', body.data.paypal_id);
    form.append('total', body.data.total);
    form.append('fecha', body.data.created_at);
    form.append('address', body.address);
};

module.exports = {
    getBills: getBills,
    getExitoso: getExitoso,
    postPay: postPay,
    postCards: postCards


}