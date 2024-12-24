const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const auth = require('../auth/auth.js');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../upload/');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

router.post('/', auth.verify, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const extension = path.extname(req.file.originalname);
        const imageName = uuidv4() + extension;
        const destPath = path.join(uploadDir, imageName);

        // Process image with sharp
        await sharp(req.file.buffer)
            .resize(400, 266, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 90, progressive: true })
            .toFile(destPath);

        console.log('Uploaded:', req.file.originalname, req.file.size);
        res.send(imageName);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error processing upload');
    }
});


//router.get('/:file', function(req, res, next){
//	imageName = req.params.file;
//	imagePath = path.join(__dirname, '../upload/', imageName);
//	var img = fs.readFileSync(imagePath);
//	res.writeHead(200, {'Content-Type': 'image/jpg' });
//	res.end(img, 'binary');
//});


module.exports = router;
