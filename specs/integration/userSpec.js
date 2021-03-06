var agent = require('superagent');
var config = require("../../config.js");
var fixture = require('./../fixtures/fixture.js');
var User = require('../../models/user.js');
//var httpMocks = require('node-mocks-http');

var apiVersion = '/v1';
var URL = config.apiURI + ':' + config.expressPort + "/api" + apiVersion;

var user = {
  username: 'user',
  password: 'password',
};

var seedUser = {};
var seedImage;

describe("A user", function() {
  // delete the database before each time
  beforeEach(function(done){
    fixture.deleteDB(function(err, db){
      // make sure it was able to delete the database ok
      expect(err).toEqual(null);
      // seed a user
      fixture.seedImage(function(err, image){
        expect(err).toEqual(null);
        seedImage = image;
        user.userImage = image._id;
        fixture.seedUser(user, function(err, user){
          expect(err).toEqual(null);
          seedUser = user;
          done();
        });
      });
    });
  });
  it("should be able to register", function(done) {
    var user = {
      username: 'user2',
      password: 'stillpassword',
      interests: ['yogaVinyasa']
    };
    agent
    .post(URL + '/users')
    //.get('http://localhost:3000/api/v1/templates')
    .set('Content-Type', 'application/json')
    .send({
      username: user.username,
      password: user.password,
      interests: user.interests
    })
    .end(function(res){
      expect(res.status).toEqual(200);
      expect(res.body._id).toBeDefined();
      User
      .findOne({username: user.username})
      .exec(function(err, savedUser){
        expect(err).toEqual(null);
        expect(savedUser).toBeDefined();
        expect(savedUser.interests[0]).toEqual(user.interests[0]);
        done();
      });
    });
  });
  it("should be able to forget to add an interest", function(done) {
    // if the user forgets to add an interest, have the backend add a default
    var user = {
      username: 'user2',
      password: 'stillpassword'
    };
    agent
    .post(URL + '/users')
    //.get('http://localhost:3000/api/v1/templates')
    .set('Content-Type', 'application/json')
    .send({
      username: user.username,
      password: user.password
    })
    .end(function(res){
      expect(res.status).toEqual(200);
      expect(res.body._id).toBeDefined();
      User
      .findOne({username: user.username})
      .exec(function(err, savedUser){
        expect(err).toEqual(null);
        expect(savedUser).toBeDefined();
        expect(savedUser.interests[0]).toEqual('yoga');
        done();
      });
    });
  });
  // the following test case can be reenabled if you decide to use username/password auth aka basic auth
  //it("should require the user to have a matching password", function(done) {
  //  agent
  //  .get(URL + '/users/' + seedUser.username)
  //  .auth(seedUser.username, 'wrong')
  //  .end(function(res){
  //    expect(res.status).toEqual(500);
  //    done();
  //  });
  //});
  it("should be able to access user settings", function(done) {
    agent
    .get(URL + '/users/' + seedUser.id)
    .send({ access_token: seedUser.token })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      expect(settings.password).not.toBeDefined();
      expect(settings.lastLogin).toBeDefined();
      expect(settings.userImage).toBeDefined();
      expect(settings.auths).toBeDefined();
      expect(settings.lastLogin).toBeDefined();
      expect(settings.auths[0].name).toBeDefined();
      expect(settings.interests).toBeDefined();
      expect(settings.shortDescription).toBeDefined();
      //expect(settings.username).toEqual(seedUser.username);

      done();
    });
  });
  it("should be able to change their shortDescription", function(done) {
    agent
    .post(URL + '/users/' + seedUser.id)
    .set('Content-Type', 'application/json')
    .send({
      access_token: seedUser.token,
      shortDescription: "My short description"
    })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      // find that user and check the values now
      User
      .findOne({ _id: seedUser.id })
      .lean()
      .exec(function(err, user){
        expect(user.profile.shortDescription).toEqual("My short description");
        done();
      });
    });
  });
  it("should be able to change their interests", function(done) {
    agent
    .post(URL + '/users/' + seedUser.id)
    .set('Content-Type', 'application/json')
    .send({
      access_token: seedUser.token,
      interests: ["bikramYoga", "ddpYoga"]
    })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      // find that user and check the values now
      User
      .findOne({ _id: seedUser.id })
      .lean()
      .exec(function(err, user){
        expect(user.interests).toEqual(["bikramYoga", "ddpYoga"]);
        done();
      });
    });
  });
  it("should be able to change their image", function(done) {
    agent
    .post(URL + '/users/' + seedUser.id)
    .set('Content-Type', 'application/json')
    .send({
      access_token: seedUser.token,
      userImage: seedImage._id
    })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      // find that user and check the values now
      User
      .findOne({ _id: seedUser.id })
      .lean()
      .exec(function(err, user){
        expect(user.userImage).toEqual(seedImage._id.toString());
        done();
      });
    });
  });
  it("should be able to add a device to a user", function(done) {
    agent
    .post(URL + '/users/' + seedUser.id + '/devices')
    .set('Content-Type', 'application/json')
    .send({
      access_token: seedUser.token,
      platform: 'ios',
      token: 'a591bde2 720d89d4 086beaa8 43f9b061 a18b36b4 8cd0008a 1f347a5a d844be95'
    })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      // find that user and check the values now
      User
      .findOne({ _id: seedUser.id })
      .lean()
      .exec(function(err, user){
        expect(user.devices.length).toEqual(1);
        expect(user.devices[0].token).toEqual("a591bde2720d89d4086beaa843f9b061a18b36b48cd0008a1f347a5ad844be95");
        done();
      });
    });
  });
  it("should be able to remove a device from a user", function(done) {
    // add device to user as part of the setup
    agent
    .post(URL + '/users/' + seedUser.id + '/devices')
    .set('Content-Type', 'application/json')
    .send({
      access_token: seedUser.token,
      platform: 'ios',
      token: 'a591bde2 720d89d4 086beaa8 43f9b061 a18b36b4 8cd0008a 1f347a5a d844be95'
    })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      // find that user and check the values now
      // remove that device from the user
      agent
      .del(URL + '/users/' + seedUser.id + '/devices')
      .set('Content-Type', 'application/json')
      .send({
        access_token: seedUser.token,
        platform: 'ios',
        token: 'a591bde2 720d89d4 086beaa8 43f9b061 a18b36b4 8cd0008a 1f347a5a d844be95'
      })
      .end(function(res){
        var settings = res.body;
        expect(res.status).toEqual(200);
        // find that user and check the values now
        User
        .findOne({ _id: seedUser.id })
        .lean()
        .exec(function(err, user){
          // make sure the whole user wasn't delete
          expect(user).not.toBeUndefined();
          // make sure the user no longer has any devices
          expect(user.devices.length).toEqual(0);
          done();
        });
      });
    });
  });
  it("should be able to change their username", function(done) {
    var newUsername = "changedUsername";
    agent
    .post(URL + '/users/' + seedUser.id)
    .set('Content-Type', 'application/json')
    .send({
      access_token: seedUser.token,
      username: newUsername
    })
    .end(function(res){
      var settings = res.body;
      expect(res.status).toEqual(200);
      // find that user and check the values now
      User
      .findOne({ _id: seedUser.id })
      .lean()
      .exec(function(err, user){
        expect(user.username).toEqual(newUsername);
        seedUser.username = user.username;
        done();
      });
    });
  });
  it("should not allow you to change to an existing username", function(done) {
    // register a new user
    var user = {
      username: 'user2',
      password: 'stillpassword',
      interests: ['yogaVinyasa']
    };
    agent
    .post(URL + '/users')
    //.get('http://localhost:3000/api/v1/templates')
    .set('Content-Type', 'application/json')
    .send({
      username: user.username,
      password: user.password,
      interests: user.interests
    })
    .end(function(res){
      expect(res.status).toEqual(200);
      expect(res.body._id).toBeDefined();
      User
      .findOne({username: user.username})
      .exec(function(err, savedUser){
        var newUsername = user.username;
        agent
        .post(URL + '/users/' + seedUser.id)
        .set('Content-Type', 'application/json')
        .send({
          access_token: seedUser.token,
          username: newUsername
        })
        .end(function(res){
          var settings = res.body;
          expect(res.status).toEqual(500);
          // find that user and check the values now
          User
          .findOne({ _id: seedUser.id })
          .lean()
          .exec(function(err, user){
            expect(user.username).not.toEqual(newUsername);
            expect(user.username).toEqual(seedUser.username);
            done();
          });
        });
      });
    });
  });
});
