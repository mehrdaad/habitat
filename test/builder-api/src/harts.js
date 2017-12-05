const expect = require('chai').expect;
const supertest = require('supertest');
const request = supertest('http://localhost:9636/v1');
const fs = require('fs');

var data = fs.readFileSync(__dirname + '/../fixtures/neurosis-testapp-0.1.3-20171205003213-x86_64-linux.hart');

describe('Working with hart files', function() {
  describe('Uploading files', function() {
    it('does not allow unauthenticated users to upload files', function(done) {
      request.post('/depot/pkgs/neurosis/testapp/0.1.3/20171205003213')
        .query({checksum: '3138777020e7bb621a510b19c2f2630deee9b34ac11f1c2a0524a44eb977e4a8'})
        .set('Content-Length', data.length)
        .send(data)
        .expect(401)
        .end(function(err, res) {
          expect(res.text).to.be.empty;
          done(err);
        });
    });

    it('allows authenticated users to upload files', function(done) {
      request.post('/depot/pkgs/neurosis/testapp/0.1.3/20171205003213')
        .set('Authorization', global.boboBearer)
        .query({checksum: '3138777020e7bb621a510b19c2f2630deee9b34ac11f1c2a0524a44eb977e4a8'})
        .set('Content-Length', data.length)
        .send(data)
        .expect(201)
        .end(function(err, res) {
          expect(res.text).to.equal('/pkgs/neurosis/testapp/0.1.3/20171205003213/download');
          done(err);
        });
    });
  });
});
