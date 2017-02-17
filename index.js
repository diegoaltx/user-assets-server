const fs = require('fs');
const express = require('express');
const multer = require('multer');

var defaults = {
    destination: 'uploads',
    tempDestination: 'temp',
    collections: {}
};

function server(options) {
    const config = Object.assign({}, defaults, options);

    const app = express();

    app.locals.config = config;

    makeDirs(config);

    app.get('*', express.static(config.destination));

    app.post(
        '/:collection',
        validateCollection,
        handleUpload,
        saveFile
    );

    return app;
}

function makeDirs(config) {
    const collections = Object.keys(config.collections);
    const destinationDir = config.destination;

    if(!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir);
    }

    collections.forEach(collection => {
        let collectionDir = config.destination + '/' + collection;

        if(!fs.existsSync(collectionDir)) {
            fs.mkdirSync(collectionDir);
        }
    });
}

function validateCollection(req, res, next) {
    const config = req.app.locals.config;
    const collection = req.params.collection;
    const collectionConfig = config.collections[collection];

    if(collectionConfig === undefined) {
        res.status(404).send('Unknown collection: ' + collection);
        return;
    }

    req.collection = Object.assign({name: collection}, collectionConfig);

    next();
}

function handleUpload(req, res, next) {
    const config = req.app.locals.config;

    const upload = multer({
        dest: config.tempDestination,
        fileFilter: fileFilter
    })
    .single('file');

    upload(req, res, err => {
        if(err && err.code === 'INVALID_FILE_TYPE') {
            res.status(403).send(err.message);
            return;
        }

        if(err) {
            res.status(500).send('Error uploading the file');
            return;
        }

        if(!req.file) {
            res.status(400).send('A file field is required');
            return;
        }

        next();
    });
}

function fileFilter(req, file, cb) {
    const accept = req.collection.accept;
    const isValid = (accept && accept.indexOf(file.mimetype) !== -1);

    if(!isValid) {
        let error = new Error('File type is not acceptable by collection');
        error.code = 'INVALID_FILE_TYPE';
        cb(error);
        return;
    }

    cb(null, true);
}

function saveFile(req, res) {
    const config = req.app.locals.config;
    const collection = req.collection;
    const file = req.file;
    const extension = getExtension(file);

    const filename = [file.filename, extension].join('');
    const relativePath = [collection.name, filename].join('/');
    const destPath = [config.destination, relativePath].join('/');

    fs.rename(file.path, destPath, err => {
        if(err) {
            res.status(500).send('Error saving the file');
            return;
        }

        res.status(200).send(relativePath);
    });
}

function getExtension(file) {
    const path = require('path');
    return path.extname(file.originalname);
}

module.exports = server;
