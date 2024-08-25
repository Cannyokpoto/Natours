const fs = require("fs");

const Tour = require("./../models/tourModel");
const { match } = require("assert");
const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const path = require("path");


//middleware to get top 5 cheap tours
exports.aliasTopTour = async(req, res, next) =>{
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  
  next();
}


//Tour stats
exports.getTourStats = catchAsync(async (req, res, next) =>{
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }
      },

      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        }
      },

      {
        $sort: { avgPrice: 1 }
      }
    ])


    res.status(200).json({
      status: "success",
      results: stats.length,
      data: {
        stats
      },
    });
})

//to get monthly plan  of tours
exports.getMonthlyPlan = catchAsync(async (req, res, next)=>{

    const year = req.params.year * 1; //2021
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },

      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },

      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },

      {
        $addFields: { month: '$_id' }
      },

      
      {
        $project: { _id: 0 }
      },

      {
        $sort: { numTourStarts: 1 }
      },
    ])

    res.status(200).json({
      status: "success",
      results: plan.length,
      data: {
        plan
      },
    });
})


//get all tours
exports.getAllTours = factory.getAll(Tour);

//get a single tour
exports.getOneTour = factory.getOne(Tour, { path: 'reviews' });

//Create a tour
exports.createTour = factory.createOne(Tour);

//Update tour
exports.updateTour = factory.updateOne(Tour);

//delete a tour
exports.deleteTour = factory.deleteOne(Tour);


//to get tours within a certain radius

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //This radius is the distance provided by the user divided by the radius of the earth.
  // 3963.2 miles or 6378.1km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    //Here long must come before lat. Which is counter intuitive.
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});


//to get distance between the user's location and all the tours within their specified radius.
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});