/**
 * Autor: Dennys Moyón
 */
var resourceBackUrl = require('./../config/rest-api-url');
var request = require('request');

var postMedia = function(dataFile, token, callback){
    
    var rData = request.post(
        {
            url: resourceBackUrl.media,
            headers:{
                "Content-Type" : "application/x-www-form-urlencoded",
                "Authorization" : "Token "  + token
            }
        }, function optionalCallback(err, httpResponse, data){
              if(err){
                  console.log("error al crear el medio");
                  callback(httpResponse.statusCode, err);
              }
              if(httpResponse.statusCode == 201){
                  console.log("creado exitosamente");
                  callback(httpResponse.statusCode, JSON.parse(data));
              }else{
                  console.log("error al crear post request", data);
                  callback(httpResponse.statusCode, data);
              }
        });
    
    //DATOS PARA EL NUEVO ARCHIVO MULTIMEDIA
    var form = rData.form();
    form.append('publication', dataFile.idPublication);
    form.append('multimedia[0]name_file', dataFile.name);
    form.append('multimedia[0]format_multimedia  ', dataFile.formatMedia);
    form.append('multimedia[0]description_file', dataFile.name);
    form.append('multimedia[0]media_path', dataFile.path);
}


module.exports = {
    postMedia : postMedia
}