const mongoose = require('mongoose');
const Tour = require('./tourModel')

//Schema
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'please provide your review'],
    },

    rating: {
        type: Number,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
        
    createdAt: {
        type: Date,
        default: Date.now()
    },

    //Here I used parents referencing to avoid an infinitely growing array.
      //To reference tour
      tour: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.']
        }
      ],

       //To reference user
       user: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user.']
        }
      ]

},

{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



//the "populate" method helps to query for the tour guides with the specified IDs in the "guides" property of the tour model
reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     //to hide some properties
    //     path: 'user',
    //     select: 'name photo'
    //   }).populate({
    //     //to hide some properties
    //     path: 'tour',
    //     select: 'name'
    //   });

    this.populate({
      //to hide some properties
      path: 'user',
      select: 'name photo'
    });


    next();
});

//to calculate ratingsAverage
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId }
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    // console.log(stats);
  
    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating
      });
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5
      });
    }
  };
  
  //to call the calcAverageRatings middleware on the document after it has been saved
  reviewSchema.post('save', function() {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
  });


//to recalculate the ratingsAverage for a particular document when a review is edited or deleted
//we have to use the pre-middleware hook to gain access to the tourId in the query params
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    // console.log(this.r);
    next();
  });
  
//we can now use the post-middleware hook to call the calcAverageRatings function again, since we have access to the tourId and the document has been saved.
  reviewSchema.post(/^findOneAnd/, async function() {
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});


//Creating a model out of the schema
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;