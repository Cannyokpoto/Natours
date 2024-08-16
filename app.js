
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')


//Global middlewares

// Set security HTTP headers
app.use(helmet());

//development logging
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'))
}

// Limit requests from same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour.'
  });
  app.use('/api', limiter);


//Body parser, reading data from body into req.body
// 10kb specifies the maximum size of data that should be passed in the request body.
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection like malicious queries such as "email": { "$gt": "" } for login
app.use(mongoSanitize());

// Data sanitization against Cross-site scripting (XSS). Like trying to send a HTML element in the request body
app.use(xss());

// Prevent parameter pollution
//hpp means http parameter pollution
//whitelist is an array of properties that will permit duplicate query strings.
app.use(
    hpp({
      whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
      ]
    })
  );

//for serving static files
app.use(express.static(`${__dirname}/public`))

// test middleware
app.use((req, res, next)=>{
    req.requestTime = new Date().toISOString();
    next()
})


//Mounting routers
app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter);

//custom response for all undefined routes
app.all('*', (req, res, next) =>{
    next(new AppError(`Could not find ${req.originalUrl} on this server!`, 404))
})

//Error controller
app.use(globalErrorHandler)

module.exports = app;
