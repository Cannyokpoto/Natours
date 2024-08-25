const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');



//to set userId and tourId in the request object before making request
exports.setTourUserIds = (req, res, next) =>{
  //to allow nested route
  if(!req.body.tour) req.body.tour = req.params.tourId;
  if(!req.body.user) req.body.user = req.user.id;

  next();
}

//get all reviews
exports.getAllReviews = factory.getAll(Review);

  //Create a review
exports.createReview = factory.createOne(Review);

//get a review
exports.getReview = factory.getOne(Review);

//delete a review
exports.deleteReview = factory.deleteOne(Review);

//update review
exports.updateReview = factory.updateOne(Review);