var db = require('./../../dbs/db.js');
var User = require('./../../models/user.js');
var async = require('async');

// have a consistent user when necessary
var username = 'test';
var password = 'test';

// have the user exposed incase we need it for something
module.exports.seededUser = {
  username: username,
  password: password,
};

module.exports.deleteDB = function(cb){
  User.remove({}, function(err, user){
    cb(err, user);
  });
};
module.exports.seedUser = function(cb){
  User.create({
    username: username,
    password: password
  }, function(err, user){
    // return the user that was just created
    user = {
      username: username,
      password: password,
      hashedPass : user.password,
      _id: user._id,
      id: user.id
    };
    cb(err, user);
  });
};
module.exports.seedMeasurements = function(cb){
  async.series([
    function(cb){
      User.create({
        phone: '+18001231234'
      }, function(err, user){
        cb(null);
      });
    },
    function(cb) {
      User.addMeasurement({
        measurement: 100,
        phone: phone,
        text: 'my measurement is 100'
      }, function(err, user){
        cb(null);
      });
    },
    function(cb) {
      User.addMeasurement({
        measurement: 100,
        phone: phone,
        text: 'my measurement is 100'
      }, function(err, user){
        cb(null);
      });
    },
    function(cb) {
      User.addMeasurement({
        measurement: 100,
        phone: phone,
        text: 'my measurement is 100'
      }, function(err, user){
        cb(null);
      });
    }
  ], function(err){
    if (!err){
      cb(null);
    }
  });
};
module.exports.seedDB = function(cb){
  User.remove({}, function(err, user){
    if (err){
      console.error("Ran into error", err);
    } else {
      console.log('datbase deleted');
      User.create({
        questions: [
          {
          type: 'text',
          question: 'Name of Tenant'
        },
        {
          type: 'date',
          question: 'What is the start date?'
        },
        {
          type: 'date',
          question: 'What is the end date?'
        },
        {
          type: 'binary',
          question: 'Pets allowed',
          choices: ['yes', 'no']
        },
        {
          type: 'multiChoice',
          question: 'What are you subletting?',
          choices: ['Shared Room', 'Private Room', 'Couch', 'Floor']
        },
        {
          type: 'multiAnswer',
          question: 'Which utilities are included?',
          choices: ['electric', 'gas', 'internet', 'water']
        },
        {
          type: 'amountPerCycle',
          question: 'What is the rent amount?',
          cycles: ['hours', 'week', 'day', 'month']
        }
        ],
        version: '0.1',
        state: 'CA'
      }, function(err, user){
        if (!err){
          console.log('user created');
        } else {
          console.error('Error creating', err);
        }
      });
    }
  });

};
