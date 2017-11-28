const expect = require('chai').expect;
const supertest = require('supertest');
const request = supertest('http://localhost:9636/v1');

describe('Origin API', function() {
  describe('Create origin', function() {
    it('returns the created origin', function(done) {
      request.post('/depot/origins')
        .set('Authorization', global.boboBearer)
        .send({'name': 'neurosis'})
        .expect(201)
        .end(function(err, res) {
          expect(res.body.name).to.equal('neurosis');
          global.originNeurosis = res.body;
          done(err);
        });
    });

    it('returns the created origin again', function(done) {
      request.post('/depot/origins')
        .set('Authorization', global.loganBearer)
        .send({'name': 'xmen'})
        .expect(201)
        .end(function(err, res) {
          expect(res.body.name).to.equal('xmen');
          global.originXmen = res.body;
          done(err);
        });
    });
  });

  describe('Get origin neurosis', function() {
    it('returns the origin', function(done) {
      request.get('/depot/origins/neurosis')
        .set('Authorization', global.boboBearer)
        .expect(200)
        .end(function(err, res) {
          expect(res.body).to.deep.equal(global.originNeurosis);
          done(err);
        });
    });
  });
});
