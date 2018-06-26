var express = require('express');
var router = express.Router();

var publicationRestClient = require('./../rest-client/publication-client');

/////////////////////// FILE UPLOAD ////////////////////////
var multer = require("multer");
var upload = multer({ dest: 'tmp_uploads/' });
////////////////////////////////////////////////////////////

var wepushClient = require('./../rest-client/webpush-client');

/*router.get('/', function (req, res, next) {
  let userId = 1;
  let token = req.session.key.token;

  publicationRestClient.getPubs(userId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of publication data",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});*/

router.get('/filter/:city', function (req, res, next) {
  let cityFilter = req.params.city;
  let token = req.session.key.token;

  publicationRestClient.getPubFilter(token, cityFilter, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of publication data with filter",
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

router.get('/', function (req, res, next) {
  let token = req.session.key.token;
  let limit = isNaN(parseInt(req.query.limit)) ? null : req.query.limit;
  let offset = (req.query.offset) ? req.query.offset : null;

  publicationRestClient.getPubByPage(token, limit, offset, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving of publication data with pagination",
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

router.post('/', upload.array('media_files[]', 5), function (req, res, next) {
  let token = req.session.key.token;

  publicationRestClient.postPub(req.body, req.files, token, function (responseCode, data) {
    if (responseCode == 201) {
      let title = 'Nueva publicación registrada';
      let content = (req.body.detail.length > 100) ? req.body.detail.substring(0, 100) : req.body.detail;
      let defaultUrl = '/';
      let queryParam = data.id_publication;
      let actions = [
        {
          action: '/?pubId=' + queryParam,
          title: 'Ver Pubswall'
        },
        {
          action: '/mapview?pubId=' + queryParam,
          title: 'Ver Mapa'
        },
      ]
      wepushClient.notify(title, content, defaultUrl, actions, function (resCode, notifData) {
        console.log(resCode, notifData);
      });

      return res.status(responseCode).json({
        code: responseCode,
        title: "Publication has been created successfully",
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

router.get('/:pubId', function (req, res, next) {
  let pubId = req.params.pubId;
  let token = req.session.key.token;

  publicationRestClient.getPub(pubId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving pub detail",
        pub: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

/*router.post('/:todoId', upload.single('todo_image'), function (req, res, next) {
  let todoId = req.params.todoId;
  let token = req.session.key.token;

  console.log("Body: ", req.body);
  console.log("File: ", req.file);

  /////////////////////// FORMAT DATA ////////////////////////
  let formData;
  if (req.file !== undefined) {
    formData = {
      title: req.body.title,
      todo_image: {
        value: fs.createReadStream(req.file.path),
        options: {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        }
      },
      completed: req.body.completed,
    };
  }
  else {
    formData = {
      title: req.body.title,
      completed: req.body.completed,
    };
  }
  ////////////////////////////////////////////////////////////

  publicationRestClient.patchTodo(todoId, formData, token, function (responseCode, data) {
    if (responseCode == 200) {
      if (req.file !== undefined) {
        fs.unlink(req.file.path);
      }
      return res.status(responseCode).json({
        code: responseCode,
        title: "Todo has been updated successfully",
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

router.get('/delete/:todoId', function (req, res, next) {
  let todoId = req.params.todoId;
  let token = req.session.key.token;

  publicationRestClient.deleteTodo(todoId, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Todo has been deleted successfully",
        data: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});*/

module.exports = router;
