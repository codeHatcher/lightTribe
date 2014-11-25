var mongoose = require('mongoose');
var logger = require('./../loggers/logger.js');
var bcrypt = require('bcrypt');
/*
|-------------------------------------------------------------
| User Schema
|-------------------------------------------------------------
*/

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// if password is modified, re-hash on save
userSchema.pre('save', function(next) {
  if (this.isModified('password')){
    this.hashPassword(function(err, hash){
      if (err) {
        return next(err);
      } else {
        return next();
      }
    });
  } else {
    return next();
  }
});
/**
 * Create a new user
 * @param {object} details of the user being created
 * @config {string} username of the user
 * @config {string} password of the user
 * @param {function} cb
 * @config {object} user instance user doc instance incase you need it
 * @config {object} err Passed Error
 */
userSchema.statics.createUser = function(options, cb) {
  var username = options.username;
  var password = options.password;

  // check the user exists
  User
  .create({
    username: username,
    password: password
  }, function(err, user){
    if (!err && user){
      cb(null, user);
    } else {
      err.clientMsg = 'could not register user';
      cb(err);
    }
  });
};

/**
 * Check authentication for a user
 * @param {object} details of the user whose password is being checked
 * @config {string} username of the user
 * @config {string} password of the user
 * @param {function} cb
 * @config {object} user instance user doc instance incase you need it
 * @config {object} err Passed Error
 */
userSchema.statics.checkAuthentication = function(options, cb) {
  var username = options.username;
  var password = options.password;

  // check the user exists
  User
  .findOne({username: username})
  .select('username password')
  .exec(function(err, user){
    if (!err && user){
      user.comparePassword(password, function(err, match){
        if (match) {
          cb(null, user);
        } else {
          err = {clientMsg: 'invalid password'};
          cb(err);
        }
      });
    } else {
      err = {clientMsg: 'invalid username or password'};
      cb(err);
    }
  });
  // if user exists check the password
};
/**
 * Hash password
 * @param {function} cb
 * @config {object} err Passed Error
 * @config {boolean} hashed password 
 */
userSchema.methods.hashPassword = function(cb) {
  var user = this;
  var SALT_WORK_FACTOR = 9;
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) {
      return cb(err);
    } else {
      // hash the password with our salt
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return cb(err);
        } else {
          // override the password with the hashed version
          user.password = hash;
          return cb(null, hash);
        }
      });
    }
  });
};
/**
 * Compare two passwords for a match
 * @param {string} password entered 
 * @param {function} cb
 * @config {object} err Passed Error
 * @config {boolean} match Whether or not the password matched
 */
userSchema.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch){
    cb(err, isMatch);
  });
};
/**
 * Register a new user
 * @param {object} details of the user being registered
 * @config {string} username of the user
 * @config {string} password of the user
 * @param {function} cb
 * @config {object} user instance user doc instance incase you need it
 * @config {object} err Passed Error
 */
userSchema.statics.registerUser = function(options, cb) {
  var username = options.username;
  var password = options.password;
  // make sure existing username doesn't exist
  // make sure existing email doesn't exist
  // register user
  User.create({
    username: username,
    password: password
  }, function(err, user){
    if (!err && user){
      cb(null, user);
    } else {
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;

