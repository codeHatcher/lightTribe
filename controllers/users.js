var logger = require('./../loggers/logger.js');
var User = require('./../models/user.js');
var config = require('../config.js');

module.exports.registerUser = function registerUser (req, res, next) {
  var username = req.swagger.params.user.value.username;
  var password = req.swagger.params.user.value.password;
  logger.info('registerUser');
  User.createUser({
    username: username,
    password: password
  }, function(err, user){
    if (!err && user){
      res.status(200).send({
        _id: user.id
      });
    } else {
      res.status(500).send(err);
    }
  });
};

module.exports.readUserSettings = function (req, res, next) {
  var userId = req.swagger.params.userId.value;
  logger.info('Reading user settings for user: ' + userId);
  res.status(200).send({
    _id: "123",
    username: "codeHatcher",
    thumbnail: "https://www.google.com/images/srpr/logo11w.png",
    lastLogin: Date.now(),
    interests: ["bikramYoga", "vinyasaYoga"],
    auths: [
      {
        name: "facebook",
        enabled: "true"
      }
    ]
  });
  // Review
  // .createReviewAsync(review)
  // .then(function(review){
  //   res.status(200).send(review);
  // })
  // .catch(function(err){
  //   res.status(500).send(err);
  // });
};