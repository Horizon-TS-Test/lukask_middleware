var express = require('express');
var router = express.Router();
var reclamoCliente = require("../rest-client/eersa/reclamo-client");

router.get('/', function (req, res, next) {
    reclamoCliente.insertReclamo(function (data) {
        console.log("FROM EERSA ROUTE, DATA: ", data);
        return res.status(200).json({
            code: 200,
            title: "Successfully calling of login REST API method",
            data: data
        });
    });
});

module.exports = router;