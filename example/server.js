const server = require('../index');

const options = {
    collections: {
        images: {
            accept: ['image/jpg', 'image/png', 'image/gif']
        },
        anything: {},
        docs: {
            accept: ['text/plain']
        },
    }
};

server(options).listen(3000, () => {
    console.log('Listening at port 3000...');
});
