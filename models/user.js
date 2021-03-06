var mongoose = require('mongoose');
var logger = require('./../loggers/logger.js');
var bcrypt = require('bcrypt');
var token = require('rand-token');
var chance = new require('chance').Chance();
var apn = require('apn');
/*
|-------------------------------------------------------------
| User Schema
|-------------------------------------------------------------
*/

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { // auth token data
    value: { type: String, default: 'placeholder' },
    expires: { type: Date, default: Date.now}
  },
  // auths: [{
  //   name: { type: String }, // facebook/twitter/insta etc
  //   id: { type: String, required: false, unique: false }, // id the provider uses
  //   enabled: { type: Boolean }
  // }],
  facebook: {
    id: { type: String, required: false, unique: false },
    enabled: { type: Boolean }
  },
  auths:{
    anonymous: {
      id: { type: String, required: false, unique: true, sparse: true } // a way to identify unregistered users could use GUID or something else in the future
    },
    facebook: {
      id: { type: String, required: false, unique: false },
      enabled: { type: Boolean }
    }
  },
  userImage: { type: String, ref: 'Image' },
  profile: {
    shortDescription: { type: String, default: 'Always exploring, always learning.' }
  },
  interests: [
    { type: String } // should match interest.key
  ],
  devices: [{
    token: { type: String },
    time: { type: Date, default: Date.now },
    platform: { type: String, default: 'ios'}
  }],
  follows: [{ type: String, ref: 'User' }] // users this user is following
});

// if there is no token, generate one before saving the model for first time
userSchema.pre('save', function(next) {
  if (this.isNew){
    this.generateToken(function(err){
      return next(err);
    });
  } else {
    return next();
  }
});
// if no interests are picked, go ahead and assign them a default one
// this way when they do the search they have some interest
userSchema.pre('save', function(next) {
  if (this.isNew){
    if (!this.interests || !this.interests.length){
      this.interests = ['yoga', 'meditation'];
    }
  }
  return next();
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
 * Create a new anonymous user
 * @param {object} options of the user being created
 * @property {string} id of the user
 * @property {string} username of the user
 * @param {function} cb
 * @property {object} user doc instance incase you need it
 * @property {object} err Passed Error
 */
userSchema.statics.createAnonUser = function(options, cb) {
  var username = options.username;
  var id = options.id;
  var password = chance.string({ length: 10 });
  var interests = options.interests;

  User
  .create({
    username: username,
    password: password,
    interests: interests,
    auths:{
      anonymous: {
        id: id
      }
    }
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
 * Create a new user
 * @param {object} details of the user being created
 * @property {string} username of the user
 * @property {string} password of the user
 * @param {function} cb
 * @property {object} user instance user doc instance incase you need it
 * @property {object} err Passed Error
 */
userSchema.statics.createUser = function(options, cb) {
  var username = options.username;
  var password = options.password;
  var interests = options.interests;

  // check the user exists
  User
  .create({
    username: username,
    password: password,
    interests: interests
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
 * Check authentication for anony user, create user if you can't find all in one step
 * @param {object} options for anonymous user being check/created 
 * @property {string} username of the user
 * @property {string} password of the user
 * @property {string} interests of the user
 * @param {function} cb
 * @property {object} user instance user doc instance incase you need it
 * @property {object} err Passed Error
 */
userSchema.statics.checkAnonAuth = function(options, cb) {
  var username = options.username;
  var id = options.id;
  var interests = options.interests;

  // check if the user exists first, if they do, return username/password
  User
  .findOne({ 'auths.anonymous.id': id })
  .exec(function(err, user){
    if (!err && !user){
      // if we don't find a user, create him right then and there
      User
      .createAnonUser({
        username: username, id: id, interests: interests
      }, function(err, user){
        // send this newly created user back to the front end
        cb(err, user);
      });
    } else {
      // this means we either have a user or error let the parent fnc deal with it
      cb(err, user);
    }
  });
};

/**
 * Check authentication for a user
 * @param {object} details of the user whose password is being checked
 * @property {string} username of the user
 * @property {string} password of the user
 * @param {function} cb
 * @property {object} user instance user doc instance incase you need it
 * @property {object} err Passed Error
 */
userSchema.statics.checkAuthentication = function(options, cb) {
  var username = options.username;
  var password = options.password;

  var Promise = require('bluebird');
  // bind to have an object along the chain of promises
  Promise.resolve(User.findOne({username:username}).exec()).bind({})
  .then(function(user){
    this.user = user;
    // call comparePassword with user as the context of this vs global
    return Promise.promisify(user.comparePassword).call(user, password);
  })
  .then(function(match){
    // check password match
    if (match) {
      cb(null, this.user);
    } else {
      throw new Error("invalid username or password");
    }
  })
  .then(undefined, function(err){
    cb(err);
  });
};
/**
 * Remove device from user for notification purposes
 * @param {object} options for adding device to user
 * @property {string} token Device token which uniquely idents device
 * @property {string} platform what software is the phone running?
 * @property {number|undefined} time timestamp of token to search for
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {object} user user the device was added to
 */
userSchema.methods.removeDevice = function(options, cb) {
  var user = this;
  // if time wasn't passed in, find anything older than now, if time was passed in that means it may have come back from the apple feedback and we need to only remove anything older than that
  var time = options.time || Date.now();
  // token in consistent format
  var token = apn.Device(options.token).toString('hex');

  User.findByIdAndUpdate(
    this.id,
    {
      '$pull': {
        devices: {
          token: token,
          platform: options.platform,
          time: { '$lte': time }
        }
      }
    },
    {
      new: true,
      upsert: false
    },
    function(err, user){
      cb(err, user);
    });
};

/**
 * Remove a user to stop following them
 * @param {object} options for stopping follows to user
 * @property {string} userId user id of the user the authenticated user wants to stop following
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {object} user user who stopped following the passed in user
 */
userSchema.methods.unfollow = function(options, cb) {
  var user = this;
  var userId = options.userId
  user.follows.pull(userId);
  // TODO: make this happen in a command to prevent conflicts: User.update()
  user.save(function(err, user){
    // returning as json to prevent another save later on, could remove if necessary
    cb(err, user.toJSON());
  });
};

/**
 * Add a user to follow to user
 * @param {object} options for adding follows to user
 * @property {string} userId user id of the user the authenticated user wants to follow
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {object} user user the follows was added to
 */
userSchema.methods.follow = function(options, cb) {
  var user = this;
  var userId = options.userId
  user.follows.addToSet(userId);
  // TODO: make this happen in a command to prevent conflicts: User.update()
  user.save(function(err, user){
    // returning as json to prevent another save later on, could remove if necessary
    cb(err, user.toJSON());
  });
};
/**
 * Add device to user for notification purposes
 * @param {object} options for adding device to user
 * @property {string} token Device token which uniquely idents device
 * @property {string} platform what software is the phone running?
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {object} user user the device was added to
 */
userSchema.methods.addDevice = function(options, cb) {
  var user = this;
  // convert token to consistent format
  var token = apn.Device(options.token).toString('hex');
  user.devices.push({
    platform: options.platform,
    token: token,
    time: Date.now()
  });
  user.save(function(err, user){
    cb(err, user);
  });
};
/**
 * Hash password
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {boolean} hashed password 
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
 * Static to Check validity of token
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {boolean} new generated token
 */
userSchema.statics.checkToken = function(cb) {
  var value = token.generate('18');
  this.token.value = value;
  cb(null, value);
};
/**
 * Generate new auth token
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {string} new generated token
 */
userSchema.methods.generateToken = function(cb) {
  var value = token.generate('18');
  this.token.value = value;
  cb(null, value);
};
/**
 * Compare two passwords for a match
 * @param {string} password entered 
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {boolean} match Whether or not the password matched
 */
userSchema.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch){
    cb(err, isMatch);
  });
};
/**
 * Find user based on token provided
 * @param {object} details of the user being registered
 * @property {string} token being looked up
 * @param {function} cb
 * @property {object} user instance user doc instance incase you need it
 * @property {object} err Passed Error
 */
userSchema.statics.findByToken = function(options, cb) {
  var token = options.token;
  User
  .findOne({'token.value': token})
  .exec(function(err, user){
    cb(err, user);
  });
};
/**
 * Register a new user
 * @param {object} details of the user being registered
 * @property {string} username of the user
 * @property {string} password of the user
 * @param {function} cb
 * @property {object} user instance user doc instance incase you need it
 * @property {object} err Passed Error
 */
userSchema.statics.registerUser = function(options, cb) {
  var username = options.username;
  var password = options.password;
  var interests = options.interests;
  // make sure existing username doesn't exist
  // make sure existing email doesn't exist
  // register user
  User.create({
    username: username,
    password: password,
    interests: interests
  }, function(err, user){
    if (!err && user){
      cb(null, user);
    } else {
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};
/**
 * Update user profile and interest information
 * @param {object} cb
 * @property {object} options passed options
 * @property {string} options.image Image to replace existing image
 * @param {function} cb
 * @property {object} err Passed Error
 * @property {string} user updated user
 */
userSchema.methods.updateUserSettings = function(options, cb) {
  var _id = this._id;
  User
  .findOne({_id: _id})
  .exec(function(err, user){
    if (!err && user) {
      // replace values with anything passed in
      if (typeof options.userImage !== "undefined"){
        user.set('userImage', options.userImage);
      }
      if (typeof options.shortDescription !== "undefined"){
        user.profile.shortDescription = options.shortDescription;
      }
      if (typeof options.username !== "undefined"){
        user.set('username', options.username);
      }
      if (typeof options.interests !== "undefined"){
        user.set('interests', options.interests);
      }
      user.save(function(err, savedUser){
        cb(err, savedUser);
      });
    } else {
      cb(new Error("Can't find user"), null);
    }
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;

