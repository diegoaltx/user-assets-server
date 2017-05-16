const fs = require('fs');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

var defaults = {
  destination: 'uploads',
  collections: {}
};

function getApp(options) {
  const config = Object.assign({}, defaults, options);

  const app = express();

  app.locals.config = config;

  makeDirs(config);

  app.get('*', express.static(config.destination));

  app.post(
    '/:collection',
    cors(),
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

  req.collection = Object.assign({
    name: collection,
    url: collection,
    path: `${config.destination}/${collection}`
  }, collectionConfig);

  next();
}

function handleUpload(req, res, next) {
  const config = req.app.locals.config;

  const upload = multer({
    storage: multer.memoryStorage(),
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
  const isValid = (!accept || accept.indexOf(file.mimetype) !== -1);

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

  const baseUrl = getAbsoluteBaseUrl(req);
  const uniqueName = generateUniqueFilename();
  const extension = getExtension(file);

  const promises = [];

  // save original file
  if(collection.saveOriginal !== false) {
    promises.push(saveOriginal({
      collection,
      file,
      uniqueName,
      extension
    }));
  }

  // save variations
  if(collection.variations) {
    promises.push(...saveVariations({
      collection,
      file,
      uniqueName,
      extension
    }));
  }

  Promise.all(promises)
    .then((variations) => {
      const result = {};

      variations.forEach((variation) => {
        if(!variation.url) return;
        result[variation.name] = `${baseUrl}/${variation.url}`;
      });

      res.status(200).send(result);
    })
    .catch((err) => {
      res.status(500).send('Error saving the file');
      console.log(err);
    });

}

function saveVariation(options) {
  return new Promise((resolve, reject) => {
    const done = (err, res) => {
      if(err) {
        reject(err);
        return;
      }

      let data;
      let extension;

      if(res instanceof Buffer || res instanceof String) {
        data = res;
        extension = options.extension;
      } else {
        data = res.data;
        extension = (res.extension ? res.extension : options.extension);
      }

      const uniqueName = `${options.uniqueName}_${options.variation.name}`;
      const filename = `${uniqueName}${extension}`;
      const url = `${options.collection.url}/${filename}`;
      const path = `${options.collection.path}/${filename}`;

      const destination = fs.createWriteStream(path);
      destination.write(data);
      destination.end();

      destination.on('finish', () => {
        resolve({name: options.variation.name, url});
      });

      destination.on('error', reject);
    };

    const handler = options.variation.handler;
    const buffer = options.file.buffer;

    handler({buffer}, done);
  });
}

function saveVariations(options) {
  const promises = [];

  for(let name in options.collection.variations) {
    let handler = options.collection.variations[name];
    let variation = {name, handler};

    let variationOptions = Object.assign({}, options, {variation});

    promises.push(saveVariation(variationOptions));
  }

  return promises;
}

function saveOriginal(options) {
  return new Promise((resolve, reject) => {
    const filename = `${options.uniqueName}${options.extension}`;
    const url = `${options.collection.url}/${filename}`;
    const path = `${options.collection.path}/${filename}`;

    const destination = fs.createWriteStream(path);
    destination.write(options.file.buffer);
    destination.end();

    destination.on('finish', () => {
      resolve({name: 'original', url});
    });

    destination.on('error', reject);
  });
}

function generateUniqueFilename() {
  const timestamp = (new Date()).getTime();
  const uuid = require('crypto').randomBytes(16).toString('hex');
  return `${timestamp}_${uuid}`;
}

function getExtension(file) {
  const path = require('path');
  return path.extname(file.originalname);
}

function getAbsoluteBaseUrl(req) {
  return require('url').format({
    protocol: req.protocol,
    host: req.get('host'),
    path: req.baseUrl
  });
}

module.exports = getApp;
