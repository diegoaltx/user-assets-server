const server = require('../index');

const options = {
    collections: {
        dashcover: {
            accept: [
                'image/jpg',
                'image/png',
                'image/gif'
            ]
        },
        dashpicture: {
            accept: [
                'image/jpg',
                'image/png',
                'image/gif'
            ]
        },
        userpicture: {
            accept: [
                'image/jpg',
                'image/png',
                'image/gif'
            ]
        },
    }
};

server(options).listen(3000, () => {
    console.log('Listening at port 3000...');
});
