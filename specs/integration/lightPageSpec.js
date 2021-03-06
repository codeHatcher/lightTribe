var agent = require('superagent');
var config = require("../../config.js");
var Promise = require('bluebird');
var fixture = require('./../fixtures/fixture.js');
var User = require('../../models/user.js');
var Post = require('../../models/post.js');
//var httpMocks = require('node-mocks-http');
Promise.promisifyAll(fixture);

var apiVersion = '/v1';
var URL = config.apiURI + ':' + config.expressPort + "/api" + apiVersion;

// complete lightPage for testing
var post = {
  id: '1234',
  text: 'This is a post description',
  images: ['558d23ce7189b21400bef51b', '558d23ce7189b21400bef51b', '558d23ce7189b21400bef51b'],
  interests: ['yogaBikram', 'meditationZen'],
  latitude: 37.796096, //San fran, google maps shows lat/lng order
  longitude: -122.418145,
  privacy: "public",
  postType: "lightPage",
  street: "1234 Main St.",
  country: "USA",
  state: "OH",
  zip: "94109",
  website: "www.google.com",
  eventType: "workshop",
  shortDescription: "short description example",
  longDescription: "long description example",
  startDate: Date.now(),
  endDate: Date.now()
};

var seedPost;
var seedImage;

describe("Creating a post", function() {
  // delete the database before each time
  beforeEach(function(done){
    fixture.deleteDB(function(err, user){
      // make sure it was able to delete the database ok
      expect(err).toEqual(null);
      // seed image so we have it for the user
      fixture.seedImage({}, function(err, image){
        seedImage = image.toJSON();
        fixture.seedUser({
          username: 'test',
          password: 'test',
          email: 'test@test.com',
          interests: ['yogaBikram', 'yogaVinyasa'],
          userImage: image._id
        }, function(err, user){
          // save the user for later
          seedUser = user;
          // add the image id into the post
          post.images = [image._id, image._id, image._id];
          expect(err).toEqual(null);
          done();
        });
      });
      // seed a user
    });
  });
  it("should require access_token to be filled out", function(done) {
    agent
    .post(URL + '/posts')
    //.get('http://localhost:3000/api/v1/templates')
    .set('Content-Type', 'application/json')
    .send(post)
    .end(function(res){
      expect(res.status).toEqual(401);
      done();
    });
  });
  it("should require a valid authentication token to access", function(done) {
    agent
    .post(URL + '/posts')
    //.get('http://localhost:3000/api/v1/templates')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: 'wrongtoken' })
    .end(function(res){
      expect(res.status).toEqual(401);
      done();
    });
  });
  it("should give information on the validation error", function(done) {
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send({ access_token: seedUser.token })
    .send({
      images: post.images,
      latitude: post.latitude,
      longitude: post.longitude
    })
    .end(function(res){
      // TODO need specific error message describing what is missing
      //console.log(res.error);
      // make sure the body is not empty
      expect(res.body.error).not.toBe({});
      expect(res.body.error).toBeDefined();
      expect(res.status).toEqual(400);
      done();
    });
  });
  it("should require a text field to be filled out", function(done) {
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send({ access_token: seedUser.token })
    .send({
      images: post.images,
      latitude: post.latitude,
      longitude: post.longitude
    })
    .end(function(res){
      expect(res.status).toEqual(400);
      done();
    });
  });
  it("should be able to be submitted successfully", function(done) {
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: seedUser.token })
    .end(function(res){
      var body = res.body;
      expect(res.status).toEqual(200);
      expect(body._id).toBeDefined();
      expect(body.text).toEqual(post.text);
      expect(body.author).toEqual(seedUser.id);
      expect(body.interests).toEqual(post.interests);
      done();
    });
  });
  it("should have all the post detail", function(done) {
    // test for gh #95
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: seedUser.token })
    .end(function(res){
      var body = res.body;
      expect(res.status).toEqual(200);
      expect(body._id).toBeDefined();
      agent
      .get(URL + '/posts/' + body._id)
      .send({ access_token: seedUser.token })
      .end(function(res){
        var post = res.body;
        //throw Error();
        expect(post.author.username).toBeDefined();
        expect(post.author._id).toBeDefined();
        expect(post.author.userImage.url).toBeDefined();
        expect(post.postType).toBeDefined();
        expect(post.lightPage).toBeDefined();
        expect(post.lightPage.street).toBeDefined();
        expect(post.lightPage.country).toBeDefined();
        expect(post.lightPage.state).toBeDefined();
        expect(post.lightPage.zip).toBeDefined();
        expect(post.lightPage.website).toBeDefined();
        expect(post.lightPage.eventType).toBeDefined();
        expect(post.lightPage.shortDescription).toBeDefined();
        expect(post.lightPage.longDescription).toBeDefined();
        expect(post.lightPage.startDate).toBeDefined();
        expect(post.lightPage.endDate).toBeDefined();
        done();
      });
    });
  });
  it("should return all the posts for a specifc user", function(done) {
    // create the post
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: seedUser.token })
    .end(function(res){
      // do the test
      agent
      .get(URL + '/users/' + seedUser.id + '/posts')
      .set('Content-Type', 'application/json')
      .query({ access_token: seedUser.token })
      .query({ page: 1 })
      .end(function(res){
        var posts = res.body;
        posts.forEach(function(post){
          expect(post.author._id).toEqual(seedUser.id);
        });
        expect(posts.length).not.toEqual(0);
        expect(res.status).toEqual(200);
        done();
      });
    });
  });
});

describe("Search posts", function() {
  // delete the database before each time
  beforeEach(function(done){
    fixture.deleteDB(function(err, db){
      // make sure it was able to delete the database ok
      expect(err).toEqual(null);
      fixture.seedImage(function(err, image){
        // setup user image and post image
        post.images = [image._id.toString()];
        // seed a user
        fixture.seedUser({
          username: 'testJasmine',
          password: 'test123',
          email: 'test@email.com',
          interests: ['yogaBikram', 'yogaVinyasa'],
          userImage: image._id.toString()
        },
        function(err, user){
          expect(err).toEqual(null);
          // save the user for later
          seedUser = user;
          // setup post related items, such as the author
          post.author = seedUser._id.toString();
          agent
          .post(URL + '/posts')
          .set('Content-Type', 'application/json')
          .send(post)
          .send({ access_token: seedUser.token })
          .end(function(res){
            var body = res.body;
            seedPost = body;
            done();
          });
        });
      });
    });
  });
  it("should be returned based on query parameters", function(done) {
    agent
    .get(URL + '/posts')
    .set('Content-Type', 'application/json')
    .query({ access_token: seedUser.token })
    .query({ interests: 'yogaBikram, yogaBikram2' })
    .query({ radius: 50 })
    .query({ latitude: post.latitude })
    .query({ longitude: post.longitude })
    .query({ page: 1 })
    .end(function(res){
      var posts = res.body;
      expect(posts.length).not.toEqual(0);
      // make sure response matches correctly
      var post = posts[0];
      expect(post.author.username).toBeDefined();
      expect(post.author._id).toBeDefined();
      expect(post.author.userImage.url).toBeDefined();
      expect(post.postType).toBeDefined();
      expect(post.lightPage).toBeDefined();
      expect(post.lightPage.street).toBeDefined();
      expect(post.lightPage.country).toBeDefined();
      expect(post.lightPage.state).toBeDefined();
      expect(post.lightPage.zip).toBeDefined();
      expect(post.lightPage.website).toBeDefined();
      expect(post.lightPage.eventType).toBeDefined();
      expect(post.lightPage.shortDescription).toBeDefined();
      expect(post.lightPage.longDescription).toBeDefined();
      expect(post.lightPage.startDate).toBeDefined();
      expect(post.lightPage.endDate).toBeDefined();
      expect(res.status).toEqual(200);
      done();
    });
  });
  it("should NOT return anything within correct search radius", function(done) {
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: seedUser.token })
    .end(function(res){
      Post.readPostsBySearch({
        // 34.0204989,-118.4117325 los angeles actual distance 560km
        latitude: 34.0204989,
        longitude: -118.4117325,
        radius: 500
      }, function(err, posts){
        expect(posts.length).toEqual(0);
        expect(err).toEqual(null);
        done();
      });
    });
  });
  it("should return anything inside the search radius", function(done) {
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: seedUser.token })
    .end(function(res){
      Post.readPostsBySearch({
        // 34.0204989,-118.4117325 los angeles actual distance 560km
        latitude: 34.0204989,
        longitude: -118.4117325,
        radius: 600
      }, function(err, posts){
        expect(posts.length).toEqual(2);
        expect(err).toEqual(null);
        done();
      });
    });
  });
});

//TODO remove this for production
xdescribe("Posts", function() {
  // delete the database before each time
  beforeEach(function(done){
    fixture.deleteDB(function(err, user){
      // make sure it was able to delete the database ok
      expect(err).toEqual(null);
      // seed a user
      fixture.seedUser(function(err, user){
        // save the user for later
        seedUser = user;
        expect(err).toEqual(null);
        // seed review
        fixture.seedReview({user: seedUser},function(err, review){
          expect(err).toEqual(null);
          done();
        });
      });
    });
  });
  it("should be retrievable in list form by a user", function(done) {
    agent
    .get(URL + '/posts')
    //.get('http://localhost:3000/api/v1/templates')
    .set('Content-Type', 'application/json')
    .query({access_token: seedUser.token})
    .end(function(res){
      var posts = res.body;
      expect(posts.length).toEqual(1);
      expect(posts[0]._id).toBeDefined();
      expect(res.status).toEqual(200);
      done();
    });
  });
  it("should be retrievable even when imageid in post is not real", function(done) {
    // post a post with fake images
    agent
    .post(URL + '/posts')
    .set('Content-Type', 'application/json')
    .send(post)
    .send({ access_token: seedUser.token })
    .end(function(res){
      var body = res.body;
      agent
      .get(URL + '/posts')
      //.get('http://localhost:3000/api/v1/templates')
      .set('Content-Type', 'application/json')
      .query({access_token: seedUser.token})
      .end(function(res){
        var posts = res.body;
        expect(res.status).toEqual(200);
        expect(posts.length).toEqual(2);
        // make sure one of them has images populated
        expect(posts[0].images.length || posts[1].images.length).toBeTruthy();
        // make sure one of them doesn't have images populated (yes, not a great test)
        expect(posts[0].images.length && posts[1].images.length).toBeFalsy();
        done();
      });
    });
  });
});
