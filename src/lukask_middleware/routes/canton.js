var express = require('express');
var router = express.Router();

var cantonRestClient = require('./../rest-client/canton-client');

router.get('/:province_id', function (req, res, next) {
    console.log("Paso a middle ware.......................");
    
 
    let pronvince_id = req.params.province_id;

    cantonRestClient.getCanton(pronvince_id, function (responseCode, data) {
        console.log("Datos dede demiddle");
        console.log(data.cantons);
        if (responseCode == 200) {
            return res.status(responseCode).json({
                code: responseCode,
                title: "Successfully retrieving of canton data",
                data: data.cantons
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
