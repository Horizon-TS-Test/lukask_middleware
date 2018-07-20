
"use strict";
/*****************************
 *********** Imports *********
 *****************************/
var path            = require('path');
//var url             = require('url');
var minimist        = require('minimist');
//var ws              = require('ws');
var express         = require('express');
var http            = require('http');
var fs              = require('fs');
var kurentoServerWs = require('../config/kurento-server').kurentoServer_url_ws
var cryptoGenerate  = require('../tools/crypto-generator');
var kurentoClientLib  = require('kurento-client');
var WebSocket = require('ws').Server;
//var as  = require('express-ws');


/*****************************
 ***** Global varibles *******
 *****************************/
var kurentoClient   = null;
var idCounter       = 0;
var candidatesQueue = {};
var presenter       = null;
var viewers         = [];
var noPresentTransmission = "Aun no existe ninguna transmici\u00f3n en linia, intentelo mas tarde";
var presenters      = [];

/***
 * Se procede a iniciar el servidor socket
 */
var app     = express();
var server  = http.createServer(app);
server.listen(8080);

//Conectamos con los servidores.
var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: '',
        ws_uri: kurentoServerWs
    }
});

// Inicailizamos el socket
var  wss = new WebSocket({
    server : server,
    path : '/lukaskstreaming'
}); 

/**********************************************
 ********* Acciones  con el socket ************ 
 **********************************************/
wss.on("connection", function(ws){
    
    //generamos clave unica
    var sessionId = nextUniqueId();
    console.log("Conexion recibida con id", sessionId);

    //En caso de error del connecion
    ws.on("error", function(error){
        console.log("Error en la conexion para la session: " + sessionId + " con error, " + error);
        stopTransmission(sessionId, null);
    });

    //En caso de cerrar la conexion del wss
    ws.on("close", function(){
        console.log("conexion cerrada para la secion: " + sessionId)
        stopTransmission(sessionId, null);
    });

    //Escucha las acciones enviadas desde el cliente.
    ws.on('message', function(_message){
        let message = JSON.parse(_message);
        console.log("Mensaje recibido: " + message.userId + " para la session: " + sessionId);

        switch(message.keyWord){
            case 'presenter' :
                startPresenter(sessionId, ws, message.sdpOffer, message.userId, function(error, sdpAnswer){
                    if(error){
                        return ws.send(JSON.stringify({
                            keyWord : 'presenterResponse',
                            response : 'rejected',
                            message : error
                        }));
                    }

                    ws.send(JSON.stringify({
                        keyWord : 'presenterResponse',
                        response : 'accepted',
                        sdpAnswer : sdpAnswer
                    }));
                });
                break;
            case 'viewer':
                startViewer(sessionId, ws, message.sdpOffer, message.idOwnerTrans, function(error, sdpAnswer){
                    if(error){
                        return ws.send(JSON.stringify({
                            keyWord : 'viewerResponse',
                            response : 'rejected',
                            message : error
                        }));
                    }

                    ws.send(JSON.stringify({
                        keyWord : 'viewerResponse', 
                        response : 'accepted',
                        sdpAnswer : sdpAnswer
                    }));
                });
                break;
            case 'stop':
                stopTransmission(sessionId, message.idUser);
                break;
            case 'onIceCandidate':
                onIceCandidate(sessionId, message.candidate)
                break;
            default:
                ws.send(JSON.stringify({
                    keyWord : 'ERROR',
                    message : 'Message invalid: ' + message
                }));
                break;
        }
    })
});

/**********************************************
 *** Funciones para proceso de transmicion ****
 **********************************************/

/**
 * Proceso para agragar los candidatos a unirse o comenzar con la transmición.
 */
function onIceCandidate(sessionId, _candidate) {
	console.log("obteniendo candidatos", _candidate)
    var candidate = kurentoClientLib.getComplexType('IceCandidate')(_candidate);

    if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter.webRtcEndpoint.addIceCandidate(candidate);
    }
    else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
			console.log("sin entender q hace aqui .....",candidatesQueue[sessionId])
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

 /**
  * Permite obtener datos del cliente kurento 
  */
function getKurentoClient(callback){
    if(kurentoClient !== null){
        return callback(null, kurentoClient);
    }

    //Conecta al servidor kurento.
    kurentoClientLib(argv.ws_uri, function(error, _kurentoClient){
        if(error){
            console.log("error", error);
            return callback("No se ha podido conectar al server" + argv.ws_uri
                            + ", existe el siguiente error: " + error);
        }
        
        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

/**
 * Permite generar una clave unica, para identificadores de la transmicion.
 */
function generateKeyUser(){

    //Diccionario
    var letters = new Array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 
                            'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4',
                            '5', '6', '7', '8', '9', '0');
    var keyWord = ''
    for (var i = 0; i< 10; i++){
        keyWord += letters[Math.floor(Math.random() * letters.length)];
    }

    //Encripta la clave
    var keyUser = cryptoGenerate.encrypt(keyWord);
    console.log("Id de user encriptado", keyUser)
    return keyUser;
}

/**
 * Proceso para generar la transmicion. 
 * @param {string} sessionId 
 * @param {string} wss 
 * @param {string} sdpOffer 
 * @param {function} callback 
 */
function startPresenter(sessionId, wss, sdpOffer, userId, callback){
    
    clearCandidatesQueue(sessionId);
    /*if(presenter !== null){
        stopTransmission(sessionId);
        return callback("Otro usuario ya se encuentra transmitiendo, intentelo mas tarde");
    }*/

    console.log("array Presenters", presenters);
    if(presenters.length > 0){
       for (var item in presenters){
            if (presenters[item].userId === userId){
                stopTransmission(sessionId);
                return callback("Este usuario ya se encuentra realizando una transmici\u00f3n");
            }
       }
    }

    //Inicalizamos el presenter
    presenter = {
        id : sessionId,
        userId: userId,
        pipeline : null,
        webRtcEndpoint : null
    }
    presenters.push(presenter);
    console.log("datos del presenter", presenters);

    //Obtenermos el cliente de kurento.
    getKurentoClient(function(error, _kurentoClient){
        
        //Verificamos si existe algun error
        if(error){
            stopTransmission(sessionId);
            return callback(error)
        }

        //Verificamos que exista ya asignado un candidato para transmitir.
        if(presenter == null){
            stopTransmission(sessionId);
            return callback(noPresentTransmission)
        }

        //Se procede a crear el proceso de transmcion.
        kurentoClient.create("MediaPipeline", function(error, pipeline){
            if(error){
                stopTransmission(sessionId);
                return callback(error);
            }

            if(presenter === null){
                stopTransmission(sessionId);
                return callback(noPresentTransmission)
            }

            //Asignamos la tuberia a la transmicion.
            presenter.pipeline = pipeline;
            pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint){
                if(error){
                    stopTransmission(sessionId, userId);
                    return callback(error)
                }
                if(presenter === null){
                    stopTransmission(sessionId, null);
                    return callback(noPresentTransmission)
                }

                presenter.webRtcEndpoint = webRtcEndpoint;
                if(candidatesQueue[sessionId]){
                    while(candidatesQueue[sessionId].length){
                        //obtengo cada uno de los candidatos y los añado al EndPoint
                        var candidate = candidatesQueue[sessionId].shift();
                        console.log("candidate", candidate);
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                //Obtenemos, los datos del candidato a transmicion.
                webRtcEndpoint.on("OnIceCandidate", function(event){
                    var candidate = kurentoClientLib.getComplexType('IceCandidate')(event.candidate);
                    wss.send(JSON.stringify({
                        keyWord : 'iceCandidate',
                        candidate : candidate
                    }));
                });
                
                //Proceso de seteo de datos ofertantes. 
                webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
                    if (error){
                        stopTransmission(sessionId, userId);
                        return callback(error);
                    }
                    if(presenter === null){
                        stopTransmission(sessionId, null);
                        return callback(noPresentTransmission)
                    }

                    callback(null, sdpAnswer);
                });

                //Verificamos, errores
                webRtcEndpoint.gatherCandidates(function(error){
                    if (error){
                        stopTransmission(sessionId, userId);
                        return callback(error);
                    }
                });
            });
        });
    });
}

/**
 * Proceso para presetar la transmicion a un viewer.
 * @param {*} sessionId 
 * @param {*} wss 
 * @param {*} sdpOffer 
 * @param {*} callback 
 */
function startViewer(sessionId, wss, sdpOffer, idOwnerTrans, callback){
    console.log("Entro a al viewer");
    clearCandidatesQueue(sessionId);
    presenter = getPresenter(idOwnerTrans);
    
    if(presenter === null){
        stopTransmission(sessionId, null);
        return callback(noPresentTransmission);
    }

    presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint){
        if(error){
            stopTransmission(sessionId, idOwnerTrans);
            return callback(error)
        }
        
        viewers[sessionId] = {
            "webRtcEndpoint" : webRtcEndpoint,
            "ws" : wss,
            "idOwnerTrans": idOwnerTrans
        }

        if (presenter == null){
            stopTransmission(sessionId, null);
            return callback(noPresentTransmission);
        }

        if (candidatesQueue[sessionId]){
            while(candidatesQueue[sessionId].length){
                var candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        webRtcEndpoint.on('OnIceCandidate', function(event){
            var candidate = kurentoClientLib.getComplexType("IceCandidate")(event.candidate)
            wss.send(JSON.stringify({
                keyWord : 'iceCandidate',
                candidate : candidate
            }));
        });

        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
            if(error){
                stopTransmission(sessionId, idOwnerTrans);
                return callback(error);
            }

            if(presenter === null){
                stopTransmission(sessionId, null);
                return callback(noPresentTransmission)
            }

            presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error){
                if (error){
                    stopTransmission(sessionId, idOwnerTrans);
                    return callback(error);
                }
                if(presenter === null){
                    stopTransmission(sessionId, null);
                    return callback(noPresentTransmission);
                }
                callback(null, sdpAnswer);
                webRtcEndpoint.gatherCandidates(function(error){
                    if(error){
                        stopTransmission(sessionId, idOwnerTrans);
                        return callback(error)
                    }
                });
            })
        })

    });
}

/**
 * Detiene la transmición, dado el identificador de sesion.
 * @param {string} sessionId  secion actual
 */
function stopTransmission(sessionId, idOwnerTrans){
  
    console.log("Id a detener", idOwnerTrans);
    var sessionViewers = [];
    if (viewers.length < 1 && presenters.length === 1) {
        presenters = [];
		console.log('Closing kurento client');
		if(kurentoClient !== null){
			kurentoClient.close();
			kurentoClient = null;
		}
    }

    if(idOwnerTrans == null){
        presenter = getForSession(sessionId);
    }else{
        presenter = getPresenter(idOwnerTrans);
    }
    
    if(presenter != null){
        for (var i in viewers) {
            var viewer = viewers[i];
			if (viewer.ws && viewer.idOwnerTrans === presenter.userId) {
                console.log("viewer", viewer)
                sessionViewers.push(i);
				viewer.ws.send(JSON.stringify({
					keyWord : 'stopCommunication'
				}));
			}
		}
		presenter.pipeline.release();
        presenter = null;

        if(idOwnerTrans == null){
            deleteForSession(sessionId);
        }else{
            deletePresenter(idOwnerTrans);
        }
        deleteViewers(sessionViewers);

    } else if(viewers[sessionId]){
        viewers[sessionId].webRtcEndpoint.release();
        delete viewers[sessionId];
    } 

    clearCandidatesQueue(sessionId);

}

/**
 * Limpiar, candidatos.
 * @param {number} sessionId 
 */
function clearCandidatesQueue(sessionId) {
	if (candidatesQueue[sessionId]) {
		delete candidatesQueue[sessionId];
	}
}

/**
 * Generador de identificador de candidatos
 */
function nextUniqueId() {
	idCounter++;
	return idCounter.toString();
}

/**
 * Obtenemos el emisor de la transmmicion.
 * @param {number} idPresenter 
 */
function getPresenter(idPresenter){

    for(var itemP in presenters){
        if(presenters[itemP].userId == idPresenter){
            return presenters[itemP];
        }
    }
    return null;
}


/**
 * Obtenemos el emisor de la transmmicion por session.
 * @param {number} idPresenter 
 */
function getForSession(sessionId){

    for(var itemP in presenters){
        if(presenters[itemP].id == sessionId){
            return presenters[itemP];
        }
    }
    return null;
}

/**
 * Proceso de para eliminar emisores.
 * @param {number} idOwnerTrans 
 */
function deletePresenter(idOwnerTrans){
    var itemPresen = null;
    for(var itemP in presenters){
        if(presenters[itemP].userId === idOwnerTrans){
            itemPresen = itemP;
            break;
        }
    }
    console.log("itemPresen", itemPresen);
    if(itemPresen != null){
        delete presenters[itemPresen];
    }
}


/**
 * Proceso de para eliminar emisores por sessionId.
 * @param {number} idOwnerTrans 
 */
function deleteForSession(sessionId){
    var itemPresen = null;
    for(var itemP in presenters){
        if(presenters[itemP].id === sessionId){
            itemPresen = itemP;
            break;
        }
    }
    console.log("itemPresen", itemPresen);
    if(itemPresen != null){
        delete presenters[itemPresen];
    }
}

/**
 * Permite eliminar viewers previamente seleccionados.
 * @param {Array} viewersDel contiene las sessiones de los viewers
 */
function deleteViewers(viewersDel){
    try {
        for(var item in viewersDel){
            viewers[viewersDel[item]].webRtcEndpoint.release();
            delete viewers[viewersDel[item]];
        }
    }catch(err){
        console.error("Erro en el proceso de eleiminar viewer", err)
    }
}

