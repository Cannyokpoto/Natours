const fs = require("fs");

const Tour = require("./../models/tourModel");
const { match } = require("assert");
const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

//Reading a file
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )

//Param middleware
//To check for a non-existent id
// exports.checkId = (req, res, next, val)=>{
//     const id = req.params.id * 1;
//     const singleTour = tours.find(el => el.id === id);

//     //To check for a non-existent id
//     if(!singleTour){
//         return res.status(404).json({
//             status: 'fail',
//             message: "invalid tour ID"
//         })
//     }
//     console.log(`Tour id is: ${val}`)
//     next()
// }


//middleware to get top 5 cheap tours
exports.aliasTopTour = async(req, res, next) =>{
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  
  next();
}


//get all tours
exports.getAllTours = catchAsync(async (req, res, next) => {

  // console.warn('current environment:', process.env.NODE_ENV)

    //Calling Api features
    const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    const tours = await features.query;
    

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours
      },
    });
});

//get a single tour
exports.getOneTour = catchAsync(async (req, res, next) => {
 
    const singleTour = await Tour.findById(req.params.id);

    if(!singleTour){
      return next(new AppError(`No tour found with ID ${req.params.id}`, 404))
    }

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      data: {
        singleTour,
      },
    });
});

//Create a tour
exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        newTour,
      },
    });
});

//Update tour
exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if(!tour){
      return next(new AppError(`No tour found with ID ${req.params.id}`, 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
});

//delete a tour
exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if(!tour){
      return next(new AppError(`No tour found with ID ${req.params.id}`, 404))
    }
    
    res.status(204).json({
      status: "success",
      message: `tour with id ${req.params.id} deleted successfully!`,
    });
});


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

//To get secret tours
// exports.getSecretTours = async (req, res) =>{
//   try {
//     const secret = await Tour.find();
//     res.status(200).json({
//       results: secret.length,
//       status: "success",
//       requestedAt: req.requestTime,
//       data: {
//         secret,
//       },
//     });

//   } catch (error) {
//     res.status(404).json({
//       status: "fail",
//       requestedAt: req.requestTime,
//       message: "Resource not found!",
//     });
//   }
// }