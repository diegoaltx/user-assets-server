const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-http'));
chai.use(require('chai-fs'));

const server = require('../index');

const options = {
    destination: __dirname + '/uploads',
    tempDestination: __dirname + '/temp',
    collections: {
        images: {accept: ['image/png']},
        anything: {}
    }
};

const instance = server(options);

it('should return an error if collections does not exist', (done) => {
    chai.request(instance)
    .post('/notexists')
    .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.text).to.contain('Unknown collection');
        done();
    });
});

it('should upload file if mimetype is in collection.accept', (done) => {
    chai.request(instance)
    .post('/images')
    .attach('file', fs.readFileSync(__dirname + '/test.png'), 'test.png')
    .end((err, res) => {
        expect(res).to.have.status(200);
        done();
    });
});

it('should fail if file mimetype is not in collection.accept', (done) => {
    chai.request(instance)
    .post('/images')
    .attach('file', fs.readFileSync(__dirname + '/test.txt'), 'test.txt')
    .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.text).to.be.equal('File type is not acceptable by collection');
        done();
    });
});

it('should upload any mimetype if collection.accept is not defined', (done) => {
    chai.request(instance)
    .post('/anything')
    .attach('file', fs.readFileSync(__dirname + '/test.txt'), 'test.txt')
    .end((err, res) => {
        expect(res).to.have.status(200);
        done();
    });
});
