const expect = require('chai').expect;
const supertest = require('supertest');
const request = supertest('http://localhost:9636/v1');
const fs = require('fs');

var data = fs.readFileSync(__dirname + '/../fixtures/neurosis-testapp-0.1.3-20171205003213-x86_64-linux.hart');

describe('Working with packages', function() {
  describe('Uploading packages', function() {
    it('does not allow unauthenticated users to upload packages', function(done) {
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

    it('allows authenticated users to upload packages', function(done) {
      request.post('/depot/pkgs/neurosis/testapp/0.1.3/20171205003213')
        .set('Authorization', global.boboBearer)
        .set('Content-Length', data.length)
        .query({checksum: '3138777020e7bb621a510b19c2f2630deee9b34ac11f1c2a0524a44eb977e4a8'})
        .send(data)
        .expect(201)
        .end(function(err, res) {
          expect(res.text).to.equal('/pkgs/neurosis/testapp/0.1.3/20171205003213/download');
          done(err);
        });
    });
  });

  describe('Finding packages', function() {
    it('allows me to search for packages', function(done) {
    });

    it('lists all packages');

    it('lists all unique package names');

    it('lists all packages with the specified name');

    it('lists all versions of the package with the specified name');

    it('returns the latest release of a package with the specified name');

    it('lists all packages with the specified name and version');

    it('returns the latest release of a package with the spcified name and version');

    it('returns the specified release');
  });

  describe('Other functions', function() {
    it('lists all the channels a package is in');

    it('downloads a package');

    it('toggles the privacy setting for a package');

    it('returns package stats');
  });
});
