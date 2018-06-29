/*****************************
 *********** Imports *********
 *****************************/
var path            = require('path');
var url             = require('url');
var minimist        = require('minimist');
var ws              = require('ws');
var express         = require('express');
var fs              = require('fs');
var kurentoServerWs = require('../config/kurento-server').kurentoServer_url_ws
var cryptoGenerate  = require('../tools/crypto-generator');
var kurentoClientLib  = require('kurento-client');

/*****************************
 ***** Global varibles *******
 *****************************/
var kurentoClient   = null;
var idCounter       = 0;
var candidatesQueue = {};
var presenter       = null;
var viewers         = [];
var noPresentTransmission = "Aun no existe ninguna transmici\u00f3n en linia, intentelo mas tarde";

/***
 * Se procede a iniciar el servidor socket
 */
var server  = require('../app').server;
var app     = require('../app').app;
var ws      = new ws.Server({
    server : server,
    path   : '/lukask_streaming' 
});

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'http://localhost:8443/',
        ws_uri: kurentoServerWs
    }
});

/**********************************************
 ********* Acciones  con el socket *************** 
 **********************************************/
ws.on("connection", function(error){
    
    //generamos clave unica
    var sessionId = nextUniqueId();
    console.log("Conexion recibida con id", sessionId);

    //En caso de error del connecion
    ws.on("error", function(error){
        console.log("Error en la conexion para la session: " + sessionId + " con error, " + error);
        stopTransmission(sessionId);
    });

    //En caso de cerrar la conexion del ws
    ws.on("close", function(){
        console.log("conexion cerrada para la secion: " + sessionId)
        stopTransmission(sessionId);
    });

    //Escucha las acciones enviadas desde el cliente.
    ws.on("message", function(_message){
        let message = JSON.parse(_message);
        console.log("Mensaje recibido: " + message + " para la session: " + sessionId);

        switch(message.keyWord){
            case 'presenter' :
                startPresenter(sessionId, ws, message.sdpOffer, function(error, sdpAnswer){
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
                        message : sdpAnswer
                    }));
                });
                break;
            case 'viewer':
                startViewer(sessionId, ws, message.sdpOffer, function(error, sdpAnswer){
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
                        message : sdpAnswer
                    }));
                });
                break;
            case 'stop':
                stopTransmission(sessionId);
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
	console.log("obteniendo candidatos")
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

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
 * Test de servidor.
 */
//getKurentoClient((error, kurentoClient) => {
   // if(error){
     //   console.log(error);
    //}
    //generateKeyUser();
//});

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
    keyUser = cryptoGenerate.encrypt(keyWord);
    console.log("Id de user encriptado", keyUser)
    return keyUser;
}

/**
 * Proceso para generar la transmicion. 
 * @param {string} sessionId 
 * @param {string} ws 
 * @param {string} sdpOffer 
 * @param {function} callback 
 */
function startPresenter(sessionId, ws, sdpOffer, callback){
    clearCandidatesQueue(sessionId);

    if(presenter !== null){
        stop(sessionId);
        return callback("Otro usuario ya se encuentra transmitiendo, intentelo mas tarde");
    }

    presenter = {
        id : sessionId,
        pipeline : null,
        webRtcEndpoint : null
    }
    
    //Obtenermos el cliente de kurento.
    getKurentoClient(function(error, _kurentoClient){
        
        //Verificamos si existe algun error
        if(error){
            stop(sessionId);
            return callback(error)
        }

        //Verificamos que exista ya asignado un candidato para transmitir.
        if(presenter == null){
            stop(sessionId);
            return callback(noPresentTransmission)
        }

        //Se procede a crear el proceso de transmcion.
        kurentoClientLib.create("MediaPipeline", function(error, pipeline){
            if(error){
                stop(sessionId);
                return callback(error);
            }

            if(presenter === null){
                stop(sessionId);
                return callback(noPresentTransmission)
            }

            //Asignamos la tuberia a la transmicion.
            presenter.pipeline = pipeline;
            pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint){
                if(error){
                    stop(sessionId);
                    return callback(error)
                }
                if(presenter === null){
                    stop(sessionId);
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
                    var candidato = kurentoClient.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id : 'iceCandidate',
                        candidate : candidate
                    }));
                });
                
                //Proceso de seteo de datos ofertantes. 
                webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
                    if (error){
                        stop(sessionId);
                        return callback(error);
                    }
                    if(presenter === null){
                        stop(sessionId);
                        return callback(noPresentTransmission)
                    }

                    callback(null, sdpAnswer);
                });

                //Verificamos, errores
                webRtcEndpoint.getherCandidates(function(error){
                    if (error){
                        stop(sessionId);
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
 * @param {*} ws 
 * @param {*} sdpOffer 
 * @param {*} callback 
 */
function startViewer(sessionId, ws, sdpOffer, callback){
    
    clearCandidatesQueue(sessionId);

    if(presenter === null){
        stop(sessionId);
        return callback(noPresentTransmission);
    }

    presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint){
        if(error){
            stop(sessionId);
            return callback(error)
        }
        
        viewers[sessionId] = {
            "webRtcEndpoint" : webRtcEndpoint,
            "ws" : ws
        }

        if (presenter == null){
            stop(sessionId);
            return callback(noPresentTransmission);
        }

        if (candidatesQueue[sessionId]){
            while(candidatesQueue[sessionId].length){
                var candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        webRtcEndpoint.on('OneIceCandidate', function(event){
            var cantidate = kurentoClient.getComplexType("IceCandidate")(event.candidate)
            ws.send(JSON.stringify({
                id : 'iceCandidate',
                candidate : candidate
            }));
        });

        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
            if(error){
                stop(sessionId);
                return callback(error);
            }

            if(presenter === null){
                stop(sessionId);
                return callback(noPresentTransmission)
            }

            presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error){
                if (error){
                    stop(sessionId);
                    return callback(error);
                }
                if(presenter === null){
                    stop(sessionId);
                    return callback(noPresentTransmission);
                }
                callback(null, sdpAnswer);
                webRtcEndpoint.getherCandidates(function(){
                    if(error){
                        stop(sessionId)
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
function stopTransmission(sessionId){
    
    console.log("Se procede a detener la transmicion para la sesion: ", sessionId);
    clearCandidatesQueue(sessionId);
    if (viewers.length < 1 && !presenter) {
		console.log('Closing kurento client');
		if(kurentoClient !== null){
			kurentoClient.close();
			kurentoClient = null;
		}
    }

    if(presenter != null && presenter.id == sessionId){
        for (var i in viewers) {
			var viewer = viewers[i];
			if (viewer.ws) {
				viewer.ws.send(JSON.stringify({
					id : 'stopCommunication'
				}));
			}
		}
		presenter.pipeline.release();
		presenter = null;
		viewers = [];

    } else if(viewers[sessionId]){
        viewers[sessionId].webRtcEndpoint.release();
        delete viewers[sessionId];
    } 

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

console.log("que es esto amigos......................", express.static(path.join(__dirname, 'static')))
app.use(express.static(path.join(__dirname, 'static')));

