const expect = require('chai').expect;
const supertest = require('supertest');
const request = supertest('http://localhost:9636/v1');

describe('Origin Invitations API', function() {
  describe('Invite bobo to xmen', function() {
    it('refuses invitations from non-members', function(done) {
      request.post('/depot/origins/xmen/users/bobo/invitations')
        .set('Authorization', global.boboBearer)
        .expect(403)
        .end(function(err, res) {
          done(err);
        });
    });

    it('returns the invitation', function(done) {
      request.post('/depot/origins/xmen/users/bobo/invitations')
        .set('Authorization', global.mystiqueBearer)
        .expect(201)
        .end(function(err, res) {
          expect(res.body.account_id).to.equal(global.sessionBobo.id);
          expect(res.body.origin_id).to.equal(global.originXmen.id);
          expect(res.body.owner_id).to.equal(global.sessionMystique.id);
          global.inviteBoboToXmen = res.body;
          done(err);
        });
    });

    it('bobo shows up in the origins list of invitations', function(done) {
      request.get('/depot/origins/xmen/invitations')
        .set('Authorization', global.mystiqueBearer)
        .expect(200)
        .end(function(err, res) {
          expect(res.body.invitations[0].id).to.equal(global.inviteBoboToXmen.id);
          expect(res.body.invitations[0].account_id).to.equal(global.sessionBobo.id);
          expect(res.body.invitations[0].account_name).to.equal('bobo');
          expect(res.body.invitations[0].origin_id).to.equal(global.originXmen.id);
          expect(res.body.invitations[0].origin_name).to.equal('xmen');
          expect(res.body.invitations[0].owner_id).to.equal(global.sessionMystique.id);
          done(err);
        });
    });

    it('should wait for the account service to be updated', function(done){
      this.timeout(3000);
      setTimeout(done, 2000);
    });

    it('xmen shows up in bobos list of invitations', function(done) {
      request.get('/user/invitations')
        .set('Authorization', global.boboBearer)
        .expect(200)
        .end(function(err, res) {
          expect(res.body.invitations[0].origin_invitation_id).to.equal(global.inviteBoboToXmen.id);
          expect(res.body.invitations[0].account_id).to.equal(global.sessionBobo.id);
          expect(res.body.invitations[0].account_name).to.equal('bobo');
          expect(res.body.invitations[0].origin_id).to.equal(global.originXmen.id);
          expect(res.body.invitations[0].origin_name).to.equal('xmen');
          expect(res.body.invitations[0].owner_id).to.equal(global.sessionMystique.id);
          done(err);
        });
    });
  });

  describe('Bobo accepts the invitation to the xmen', function() {
    it('accepts the invitation', function(done) {
      request.put('/depot/origins/xmen/invitations/' + global.inviteBoboToXmen.id)
        .set('Authorization', global.boboBearer)
        .expect(204)
        .end(function(err, res) {
          done(err);
        });
    });

    it('bobo does not show up in the origins list of invitations', function(done) {
      request.get('/depot/origins/xmen/invitations')
        .set('Authorization', global.mystiqueBearer)
        .expect(200)
        .end(function(err, res) {
          expect(res.body.invitations.length).to.equal(0);
          done(err);
        });
    });

    it('xmen does not show up in bobos list of invitations', function(done) {
      request.get('/user/invitations')
        .set('Authorization', global.boboBearer)
        .expect(200)
        .end(function(err, res) {
          expect(res.body.invitations.length).to.equal(0);
          done(err);
        });
    });

    it('xmen shows up in bobos origins', function(done) {
      request.get('/user/origins')
        .set('Authorization', global.boboBearer)
        .expect(200)
        .end(function(err, res) {
          expect(res.body.account_id).to.equal(global.sessionBobo.id);
          expect(res.body.origins.length).to.equal(2);
          expect(res.body.origins[0]).to.equal('neurosis');
          expect(res.body.origins[1]).to.equal('xmen');
          done(err);
        });
    });
  });
});
