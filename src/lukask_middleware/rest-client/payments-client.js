var restUrl = require('./../config/rest-api-url');
var Planilla = require('./../models/panillas');
var Client = require("node-rest-client").Client;
//Post para el servicio

var request = require("request");


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

//Ruta no fue un exito
var getCancelado = function (body, token, callback) {

    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token
        }
    }

    get = client.get(restUrl.cancelado, args, function (data, response) {
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
        "shopping_id": 1,
        "total": 1 * 100,
        "items": [{
            "name": "PAGO DEL SERVICIO " + body.empresa + "",
            "sku": body.factura,
            "price": 1,
            "currency": "USD",
            "quantity": 1
        }],
        "return_url": "http://192.168.1.42:3000/exitoso",
        "cancel_url": "http://192.168.1.42:3000/cancelado"
    };
    /////////////////////////////////

    console.log("Dato para enviar", create_payment_json);
    ///////////////////////////////////////////////
    //Consumo del Post de la Patty
    var pay = request.post({
        url: restUrl.pay,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:7.0.1) Gecko/20100101 Firefox/7.0.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Authorization': '[{"key":"Authorization","value":"' + token + '","description":""}]',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=0'
        },
        method: 'post',
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
    console.log("Pepepepepepep", form);
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
    getBills: getBills,
    getExitoso: getExitoso,
    postPay: postPay,
    postCards: postCards,
    getCancelado: getCancelado
}