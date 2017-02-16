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
        res.status(404).send('Unknown collection: ' + collection);
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

module.exports = server;
