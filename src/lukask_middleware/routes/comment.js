var express = require('express');
var router = express.Router();

var actionRestClient = require('./../rest-client/action-client');
var actionTypes = require('./../const/action-types');

var request = require('request');
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

router.post('/', upload.single('media_file'), function (req, res, next) {
  let token = req.session.key.token;
  let commentType = actionTypes.comment;
  req.body.action_type = commentType;
  
  console.log(req.body);
  actionRestClient.postAction(req.body, req.file, token, function (responseCode, data) {
    if (responseCode == 201 || responseCode == 200) {
      wepushClient.notify('Nuevo comentario registrado', req.body.description, '/inicio', function (resCode, commentData) {
        console.log(resCode, commentData);
      });

      return res.status(responseCode).json({
        code: responseCode,
        title: "Action has been created successfully",
        comment: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

/*router.get('/:pubId', function (req, res, next) {
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
});*/

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
