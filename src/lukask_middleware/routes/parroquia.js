var express = require('express');
var router = express.Router();

var parroquiaRestClient = require('./../rest-client/parroquia-client');

router.get('/:canton_id', function (req, res, next) {
    let token = req.session.key.token;
    let canton_id = req.params.canton_id;

    parroquiaRestClient.getParroquia(canton_id, token, function (responseCode, data) {
        if (responseCode == 200) {
            return res.status(responseCode).json({
                code: responseCode,
                title: "Successfully retrieving of parroquia data",
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
