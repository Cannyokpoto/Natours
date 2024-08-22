const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


//get all reviews
exports.getAllReviews = catchAsync(async (req, res, next) => {

    // console.warn('current environment:', process.env.NODE_ENV)
  
      const reviews = await Review.find();
      
  
      res.status(200).json({
        status: "success",
        requestedAt: req.requestTime,
        results: reviews.length,
        data: {
            reviews
        },
      });
  });


  //Create a review
exports.createReview = catchAsync(async (req, res, next) => {
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        newReview,
      },
    });
});