var soap = require('soap');

var insertReclamo = function (callback) {
    var url = 'http://190.95.195.209:8090/SarWs/SarWs?WSDL';
    var args = {
        ncuenta: '127290',
        nmedidor: '',
        nposte: '',
        cliente: 'Fredi Román',
        cedula: '0603344417',
        telefono: '0329457896',
        celular: '0954786535',
        email: 'froman@mail.com',
        calle: 'Av. 9 de Octubre',
        idtipo: '1',
        idbarrio: '44',
        referencia: 'Via a San Luis',
        areclamo: 'No hay energía eléctrica',
    };
    soap.createClient(url, function (err, client) {
        client.insertReclamo(args, function (err, result) {
            console.log("LA RESPUESTA ES: ", result);
            callback({ data: result });
        });
    });
};


module.exports = {
    insertReclamo: insertReclamo
}