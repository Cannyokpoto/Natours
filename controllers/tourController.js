const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { match } = require("assert");
const Tour = require("./../models/tourModel");
const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');



//to store image in memory (as a buffer) for compression and resizing before saving
const multerStorage = multer.memoryStorage();

//multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image. Please upload only images.", 400));
  }
};

//image upload screening area
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// to finally upload image file
//upload.single is used to upload a single image to one field in a model (e.g: 1 imageCover), accesible at req.file
//upload.array is used to upload multiple images to one field in a model (e.g: 3 tour images), accesible at req.files
//upload.fields is used to upload images to multiple fields in a model (e.g: 1 imageCover, 3 tour images), accesible at req.files
exports.uploadTourImages = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);


//to resize uploaded images
exports.resizeTourImages = catchAsync(async (req, res, next)=>{

  if (!req.files.imageCover || !req.files.images) return next();

  //1) IMAGE COVER
  //req.body.imageCover is defined here to assign a value (the file name) to imageCover field in the req body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;

  //retreiving image from memory
  await sharp(req.files.imageCover[0].buffer)
    //crop image to 500px by 500px
    .resize(500, 500)
    //set format to jpeg
    .toFormat("jpeg")
    //compress to reduce file size
    .jpeg({ quality: 90 })
    //write to this directory
    .toFile(`public/img/tours/${req.body.imageCover}`);


    //2) IMAGES
    //req.body.images is initialized with an empty array so file names can be pushed in later
    req.body.images = [];

    //processing the 3 images will return 3 promises
    const tourImagesPromises = await req.files.images.map(async (file, i) =>{
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

      //retreiving image from memory
        await sharp(file.buffer)
        //crop image to 500px by 500px
        .resize(500, 500)
        //set format to jpeg
        .toFormat("jpeg")
        //compress to reduce file size
        .jpeg({ quality: 90 })
        //write to this directory
        .toFile(`public/img/tours/${filename}`);

        //here the empty images array is filled with the file names
        req.body.images.push(filename);
    });

    // the 3 returned promises a received here
    await Promise.all(tourImagesPromises);

  next()
});


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
        'Please provide latitute and longitude in the format lat,lng.',
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

  //the distance gotten from geospatial aggregation pipeline will always come in meters, so it must be converted to both miles and km
  //0.001 converts meters to km while 0.000621371 converts meters to miles
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400
      )
    );
  }

  //using aggregation pipeline
  const distances = await Tour.aggregate([
    {
      //geoNear should always be the first geospatial aggregation pipeline stage.
      $geoNear: {
        near: {
          type: 'Point',
          //multiplying the coordinates by 1 to convert them to numbers
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
    result: distances.length,
    data: {
      data: distances
    }
  });
});