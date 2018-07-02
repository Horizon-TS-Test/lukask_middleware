var mongoose= require('mongoose');

//Conexion de la DB MOngoDB
var dbURI = 'mongodb://192.168.1.15:27017/payments';

mongoose.connect(dbURI)
    .then(db => console.log('Conectado a la Base'))
    .catch(err => console.error(err));

module.exports = mongoose;