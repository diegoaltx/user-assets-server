const http = require('http');
const sharp = require('sharp');
const userAssets = require('../index');

const app = userAssets({
  collections: {
    'avatar': {
      accept: ['image/jpg', 'image/png'],
      variations: {
        thumb: createThumb
      }
    },
    'cover': {
      accept: ['image/jpg', 'image/png'],
      variations: {
        thumb: createThumb
      }
    },
  }
});

function createThumb(originalPath, variationPath) {
  sharp(originalPath)
    .resize(200, 200)
    .toFile(variationPath)
    .catch((err) => console.log(err));
}

app.use('/frontend', require('express').static('frontend'));

http.createServer(app)
  .listen(3000, () => {
    console.log('Listening at port 3000...');
  });
