const server = require('../index');

const options = {
    collections: {
        dashcover: {},
        dashpicture: {},
        userpicture: {},
    }
};

server(options).listen(3000, () => {
    console.log('Listening at port 3000...');
});
