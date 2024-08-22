const mongoose = require('mongoose');

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
    this.populate({
        //to hide some properties
        path: 'user',
        select: 'name photo'
      }).populate({
        //to hide some properties
        path: 'tour',
        select: 'name'
      });
    next();
})


//Creating a model out of the schema
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;