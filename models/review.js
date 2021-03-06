var mongoose = require('mongoose');
var logger = require('./../loggers/logger.js');
/*
|-------------------------------------------------------------
| Review Schema
|-------------------------------------------------------------
*/

var reviewSchema = new mongoose.Schema({
  company: { type: String },
  description: { type: String },
  rating: { type: Number },
  datetime: { type: Date },
  location: { type: String },
  images: [
    { type: String, ref: 'Image' }
  ],
  submitter: { type: String },
});

/**
 * Create a specific review
 * @param {object} options The options for the new review
 * @config {string} company of the review
 * @param {function} cb
 * @config {object} review 
 * @config {object} err Passed Error
 */
reviewSchema.statics.createReview = function(options, cb) {
  // we are redefining the object to make sure other random stuff doesn't come through
  var review = {
    company: options.company,
    description: options.description,
    rating: options.rating,
    images: options.images,
    datetime: options.datetime,
    location: options.location,
    submitter: options.submitter
  };

  // add review to the database
  Review.create(review, function(err, savedReview){
    if (!err && savedReview){
      // we created the savedReview successfully
      cb(null, savedReview);
    } else {
      logger.error(err);
      cb(err);
    }
  });
};
/**
 * Read a specific review
 * @param {object} options The options for the lookup
 * @config {string} review id of the review
 * @param {function} cb
 * @config {object} review 
 * @config {object} err Passed Error
 */
reviewSchema.statics.readReview = function(options, cb) {
  var id = options.id;
  // see if review exists, if so pass error
  Review.findOne({_id: id}, function(err, review){
    if (!err){
      cb(null, review);
    } else {
      // we had some sort of database error
      logger.error(err);
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};

/**
 * Read all reviews for a user
 * @param {object} options The options for the lookup
 * @config {string} options.userId user id of the user for which you want reviews
 * @param {function} cb
 * @config {object} reviews
 * @config {object} err Passed Error
 */
reviewSchema.statics.readAllReviews = function(options, cb) {
  // see if review exists, if so pass error
  Review
  .find({submitter: options.userId})
  //.populate('images')
  .exec(function(err, reviews){
    if (!err){
      cb(null, reviews);
    } else {
      // we had some sort of database error
      logger.error(err);
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};

var Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

