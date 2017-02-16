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
        res.status(404).send('Unknown collection');
        return;
    }

    req.collection = collectionConfig;

    next();
}

function handleUpload(req, res) {
    const upload = multer({dest: config.tempDestination});
    res.send('OK');
}

module.exports = server;
