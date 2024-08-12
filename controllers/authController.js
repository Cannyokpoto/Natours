const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')



const signToken = id =>{
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

//Signup contoller
exports.signup = catchAsync(async (req, res, next) =>{
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role,
    });

    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
});




//login controller

exports.login = catchAsync(async (req, res, next) =>{
    // const email = req.body.email;
    // const password = req.body.password;
    const {email, password} = req.body

    //1) Check if email and password exist
    if(!email || !password){
       return next(new AppError('Please provide email & password'), 400)
        console.warn(`You are currently on ${process.env.NODE_ENV} environment`)
    }

    //2) check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password');

    if(!user || !(await user.correctPassword(password, user.password))){
        return next( new AppError('Incorrect email or password', 401));
    }

    //3) if everything is okay, send token to client
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});


//Protected route controller
exports.protect = catchAsync(async (req, res, next) =>{

    //1) Get token and check if its there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    
    if(!token){
        return next(new AppError('You are not logged in, please log in to get access.', 401))
    }

    //2) Check if token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.warn("decoded:", decoded)

    //3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user with this token no longer exist.', 401));
    }

    //4) check if user changed password after token was issued
    //iat means "Issued at". Stating the time this token was issued to the user
    if(currentUser.passwordChangedAfter(decoded.iat)){
        return next(new AppError("User recently changed password! Please log in again.", 401));
    }

    //Grant access to protected route
    req.user = currentUser;
    next()
});


//To authorize users with certain roles to perform action e.g admin
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
      // roles ['admin', 'lead-guide']. role='user'
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }
  
      next();
    };
  };