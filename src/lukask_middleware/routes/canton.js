var express = require('express');
var router = express.Router();

var cantonRestClient = require('./../rest-client/canton-client');

router.get('/', function (req, res, next) {
    let province_id = req.query.province_id;

    cantonRestClient.getCanton(province_id, function (responseCode, data) {
        if (responseCode == 200) {
            return res.status(responseCode).json({
                code: responseCode,
                title: "Successfully retrieving of canton data",
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
