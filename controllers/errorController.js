const AppError = require('./../utils/appError')

//to handle invalid ID on get request
const handleCastErrorDB = err =>{
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

//to handle duplicate value for unique fields on post request
const handleDuplicateFieldsDB = err =>{
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
}

//to handle validation errors on post, put or patch requests
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

//to handle manipulated token Errors
const handleJWTError = err => new AppError('Invalid token, please log in again.', 401);

//to handle expired token Errors
const handleJWTExpiredError = err => new AppError('Your token has expired, please log in again.', 401);



//development error
const sendErrorDev = (err, req, res) => {
    //For API response only
    if(req.originalUrl.startsWith('/api')){
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });

    }else{
      //For the interface
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      })
    }
  };
  

  //Production error
  const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    // if (err.isOperational) {
    //   res.status(err.statusCode).json({
    //     status: err.status,
    //     message: err.message
    //   });
  
    //   // Programming or other unknown error: don't leak error details
    // } else {
    //   // 1) Log error
    //   console.error('ERROR 💥', err);
    //   console.warn('prod. error:', err);
  
    //   // 2) Send generic message
    //   res.status(500).json({
    //     status: 'error',
    //     message: 'Something went wrong!'
    //   });
    // }


    //THE CODE I COMMENTED OUT ABOVE IS STILL VERY USEFUL. I MIGHT NEED IT LATER.

    //For API response only
    if(req.originalUrl.startsWith('/api')){
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    }else{
      //For the interface
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      })
    }

  };


  //Error handling middleware
module.exports = (err, req, res, next) =>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
      } else if (process.env.NODE_ENV === 'production') {

        // let error = { ...err };
        const { name, message, errors, kind, code } = err;
        if(name === 'CastError') err = handleCastErrorDB(err);
        if(code ===11000) err = handleDuplicateFieldsDB(err)
        if (name === 'ValidationError') err = handleValidationErrorDB(err);
        if (name === 'JsonWebTokenError') err = handleJWTError(err);
        if (name === 'TokenExpiredError') err = handleJWTExpiredError(err);

        

        sendErrorProd(err, req, res);
      }
}