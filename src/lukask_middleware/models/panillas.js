//definimos el modelo
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlanillaSchema = new Schema({
    //para almacenar el path de la imgane
    factura: {
        type: String,
        required: true
    },
    empresa: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    ci: {
        type: Number,
        required: true
    },
    medidor: {
        type: Number,
        required: true
    },
    direccion: {
        type: String,
        required: true
    },
    fechaemision: {
        type: Date,
        required: true
    },
    fechapago: {
        type: Date,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
});

module.exports = mongoose.model('Planilla',PlanillaSchema);