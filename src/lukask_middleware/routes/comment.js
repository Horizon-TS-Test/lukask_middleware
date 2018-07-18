var express = require('express');
var router = express.Router();

var actionRestClient = require('./../rest-client/action-client');
var actionTypes = require('./../const/action-types');

var notifRestClient = require('./../rest-client/notification-client');
/////////////////////// FILE UPLOAD ////////////////////////
var multer = require("multer");
var upload = multer({ dest: 'tmp_uploads/' });
////////////////////////////////////////////////////////////

var wepushClient = require('./../rest-client/webpush-client');

router.get('/', function (req, res, next) {
  if (!req.query.pub_id && !req.query.com_id) {
    return res.status(400).json({
      code: responseCode,
      title: "An error has ocurred",
      error: "A parent id must be provided"
    });
  }

  let token = req.session.key.token;
  let commentType = actionTypes.comment;
  let parentId = (req.query.pub_id) ? req.query.pub_id : req.query.com_id;
  let replies = (req.query.replies) ? req.query.replies : false;
  let limit = (req.query.limit) ? req.query.limit : null;
  let offset = (req.query.offset) ? req.query.offset : null;

  actionRestClient.getActions(commentType, parentId, replies, limit, offset, token, function (responseCode, data) {
    if (responseCode == 200) {
      return res.status(responseCode).json({
        code: responseCode,
        title: "Successfully retrieving comments data",
        comments: data
      });
    }
    return res.status(responseCode).json({
      code: responseCode,
      title: "An error has occurred",
      error: data
    });
  });
});

router.post('/', upload.single('media_file'), function (req, res, next) {
  let token = req.session.key.token;
  let commentType = actionTypes.comment;
  req.body.action_type = commentType;

  actionRestClient.postAction(req.body, req.file, token, function (responseCode, data) {
    if (responseCode == 201) {
      let userNotif = data.receivers;

      if (userNotif.length > 0) {
        let receivers = [];
        let userEmitter = req.body.userName;
        //let emitterId = req.body.userId;
        let emitterImage = req.body.userImage;
        let title = 'Lukask, expresa tu opinión';
        let content;
        let defaultUrl = '/activity?pubId=' + data.publication + ((data.action_parent) ? '&comId=' + data.action_parent + '&repId=' + data.id_action : '&comId=' + data.id_action);

        for (let user of userNotif) {
          if (user.fields.owner == true) {
            content = userEmitter + " ha" + ((req.body.action_parent) ? " respondido un comentario de tu publicación" : " comentado tu publicación");
          }
          else {
            /*if(emitterId == data.pub_owner) {
              content = userEmitter + " ha" + ((req.body.action_parent) ? " respondido un comentario de su publicación" : " comentado su publicación");
            }*/
            content = userEmitter + " ha" + ((req.body.action_parent) ? " respondido un comentario de la publicación que has comentado" : " comentado la publicación en la que has interactuado");
          }
          receivers[receivers.length] = {
            user_img: emitterImage,
            user_id: user.fields.user_register,
            title: title,
            content: content,
            open_url: defaultUrl,
            actions: null
          };
        }

        notifRestClient.postNotifications(title, req.body.date, defaultUrl, receivers, token, function (notCode, notData) {
          console.log(notCode, notData);
        });

        wepushClient.notify(receivers, function (resCode, notifData) {
          console.log(resCode, notifData);
        });
      }

      return res.status(responseCode).json({
        code: responseCode,
        title: "Action has been created successfully",
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
