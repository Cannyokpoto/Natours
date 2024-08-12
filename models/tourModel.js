const mongoose = require('mongoose');
const slugify = require('slugify');


//Schema
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [10, 'A tour name must have more or equal then 10 characters']
    },

    slug: String,

    secretTour: {
        type: Boolean,
        default: false
    },

    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'the group size must be specified']
    },
    difficulty: {
        type: String,
        required: [true, 'difficulty must be specified']
    },
    ratingsAverage: {
        type: Number,
        default: 4.7,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'a tour must have a price'],
    },

    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                //the "this" key word only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price should be below the regular price'
        }
    },

    summary: {
        type: String,
        trim: true,
        required: [true, 'a tour must have a summary']
    },
    description: {
        type: String,
        trim: true
        // select: false
    },
    imageCover: {
        type: String,
        required: [true, 'a tour must have an imageCover']
    },
    images: [String],
        
    createdAt: {
        type: Date,
        default: Date.now()
    },
    
    startDates: [Date]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


//To create virtual properties. Fields that you do not want to store in the database but 
// want to get it each time you're fetching data
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
})

//Creating a Document middleware. This middleware runs before .save() and .create() but will 
// not run if there's .insertMany()

//using the pre-save hook or middleware
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next()
})

//using the post-save hook or middleware
// tourSchema.post('save', function(doc, next) {
//     console.log('Document saved successfully!')
//     next()
// })


//Creating a Query middleware.
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
})

tourSchema.post(/^find/, function(docs, next) {
    console.log(`The query took about ${Date.now() - this.start} milliseconds`)
    next();
})


//Creating a Aggregation middleware.
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

    next();
})


//Creating a model out of the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;