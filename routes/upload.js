//Express
var express = require('express');
var router = express.Router();

//File upload
var fs = require('fs'); 
var multiparty = require('multiparty'); 
var path = require('path'); 
var uuid = require('node-uuid');

/// Include ImageMagick
var im = require('imagemagick-stream');

var auth = require('../auth/auth.js');

router.post('/', auth.verify, function(req, res, next){    
    var fileName = '';
    var size = '';
    var tempPath;
    var destPath = '';
    var extension;
    var imageName;
    var destPath = '';
    var inputStream;
    var outputStream;

    var form = new multiparty.Form();
    
    form.on('error', function(err){
      console.log('Error parsing form: ' + err.stack);
    });

    form.on('part', function(part){
      if(!part.filename){
        return;
      }
      size = part.byteCount;
      fileName = part.filename;
    });

    form.on('file', function(name, file){
      tempPath = file.path;
      extension = file.path.substring(file.path.lastIndexOf('.'));
      imageName = uuid.v4() + extension;
      destPath = path.join(__dirname, '../images/', imageName);
      inputStream = fs.createReadStream(tempPath);
      outputStream = fs.createWriteStream(destPath);
      var resize = im().resize('400x400').quality(90);
      inputStream.pipe(resize).pipe(outputStream);
      outputStream.on('finish', function(){
        fs.unlinkSync(tempPath);
        console.log('Uploaded: ', fileName, size);
        res.send('/api/upload/'+imageName);
      });
    });

    form.on('close', function(){
      console.log('Uploaded!!');
    });

    form.parse(req);
});


router.get('/:file', function(req, res, next){
	imageName = req.params.file;
	imagePath = path.join(__dirname, '../images/', imageName);
	var img = fs.readFileSync(imagePath);
	res.writeHead(200, {'Content-Type': 'image/jpg' });
	res.end(img, 'binary');
});


module.exports = router;