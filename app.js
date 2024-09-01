
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const bookingController = require('./controllers/bookingController')


//the express application
const app = express();

//to trust proxies
app.enable('trust proxy');

//template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global middlewares
// to enable cross origin requests; so other domains can access our API on the browser.
app.use(cors());

//to allow all non-simple req like (delete, patch etc)
//the 'options' http method notifies the server that a non-simple request is about to be made
app.options('*', cors());

//for serving static files
app.use(express.static(path.join(__dirname, 'public')));

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


  //to allow stripe to post the checkout webhook to our endpoint
// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);


//Body parser, reading data from body into req.body
// 10kb specifies the maximum size of data that should be passed in the request body.
app.use(express.json({ limit: '10kb' }));

//to encode data from HTML forms
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//to parse cookies
app.use(cookieParser());

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


  //to compress all responses (texts not images or other files) sent to client
  app.use(compression())
  

// test middleware
app.use((req, res, next)=>{
    req.requestTime = new Date().toISOString();
    console.log(req.cookies);
    next()
})


//Mounting routers
// app.get('/', (req, res,) =>{
//   res.status(200).render('base', {
//     tour: "The forest hiker",
//     user: "Promise"
//   });
// });

// app.get('/overview', (req, res,) =>{
//   res.status(200).render('overview');
// })

// app.get('/tour', (req, res,) =>{
//   res.status(200).render('tour', {
//     title: "The forest hiker"
//   });
// })

app.use('/', viewRouter);
app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/booking', bookingRouter);

//custom response for all undefined routes
app.all('*', (req, res, next) =>{
    next(new AppError(`Could not find ${req.originalUrl} on this server!`, 404))
})

//Error controller
app.use(globalErrorHandler)

module.exports = app;
