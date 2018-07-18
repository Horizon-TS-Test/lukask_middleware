var restUrl = require('./../config/rest-api-url');
var Planilla = require('./../models/panillas');
var Client = require("node-rest-client").Client;
//Post para el servicio

var request = require("request");

//Ruta si fue un exito
var getExitoso = function (parametros, token, callback) {
    console.log("Ingreso al exitoso",parametros);
    var client = new Client();
    var payerID = parametros.params.PayerID;
    var paymentId =parametros.params.paymentId;
    
    //GET METHOD:
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }
    console.log("Che", restUrl.checkout + '/checkout?paymentId=' + paymentId + '&token=' + token + '&PayerID=' + payerID + '');

     var get = client.get(restUrl.checkout + '/checkout?paymentId=' + paymentId + '&token=' + token + '&PayerID=' + payerID + '',function (data, response) {
        callback(response.statusCode, data);
    });

    get.on("error", function (err) {
        console.log(err);
        callback(500, err.code);
    });
    ////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
};

//Ruta no fue un exito
var getCancelado = function (body, token, callback) {

    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    get = client.get(restUrl.cancelado, args, function (data, response) {
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
    var client = new Client();
     var args = {
        data: {
            "shopping_id": 1,
            "total": 1 * 100,
            "items": [{
                "name": "PAGO DEL SERVICIO " + body.empresa + "",
                "sku": body.factura,
                "price": 1,
                "currency": "USD",
                "quantity": 1
            }],
            "return_url": "http://192.168.1.42:3001/payment/exitoso",
            "cancel_url": "http://192.168.1.42:3001/payment/cancelado"
        },
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    var post = client.post(restUrl.pay, args, function (data, response) {
        callback(response.statusCode, data);
    });

    post.on("error", function (err) {
        callback(500, err.code);
    });
    ////

    ///////////////////////////////////////////////
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
            "items": [{
                "name": "Back End",
                "sku": "item",
                "price": 1,
                "currency": "USD",
                "quantity": 1
            }],
            "return_url": "http://192.168.1.20:3000/exitoso",
            "cancel_url": "http://192.168.1.20:3000/cancelado"
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
    getExitoso: getExitoso,
    postPay: postPay,
    postCards: postCards,
    getCancelado: getCancelado
}