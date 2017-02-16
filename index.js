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

    app.get('*', express.static(config.destination));

    app.post('/:collection', handleCollection, handleUpload);

    return app;
}

function handleCollection(req, res, next) {
    const config = req.app.locals.config;
    const collection = req.params.collection;
    const collectionConfig = config.collections[collection];

    if(collectionConfig === undefined) {
        let message = 'Unknown collection: ' + collection;
        res.status(404).send(message);
        console.log(message)
        return;
    }

    req.collection = collectionConfig;

    next();
}

function handleUpload(req, res, next) {
    const config = req.app.locals.config;

    const upload = multer({
        dest: config.tempDestination
    })
    .single('file');

    upload(req, res, err => {
        if(err) {
            let message = 'Error uploading the file';
            res.status(500).send(message);
            console.log(message)
            return;
        }

        if(!req.file) {
            let message = 'A file field is required';
            res.status(400).send(message);
            console.log(message)
            return;
        }

        next();
    });
}

module.exports = server;
