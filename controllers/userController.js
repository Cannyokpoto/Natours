const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const factory = require('./handlerFactory');


// To filter out fields that users are not allowed to update.
const filterObj = (obj, ...allowedFields) =>{
    //empty object to collect filtered fields
    const newObj = {};

    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });

    return newObj;
};

//for a logged in user to update their data.
exports.updateMe = catchAsync(async (req, res, next) => {

  // 1) Create error if user posts password data.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update, please use /update-password.',
        400
      )
    );
  }

  // 2) filter out fields that users are not allowed to update.
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findOneAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });


  res.status(200).json({
    status: "success",
    data:{
        user: updatedUser
    }
  });
});

//To let a logged in user delete their accout
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
  
    res.status(204).json({
      status: 'success',
      data: null
    });
});

//to let a logged in user view themselves.
exports.getMe = (req, res, next) =>{
  req.params.id = req.user.id

  next();
}


//create user
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route has not defined! Please use /signup instead.",
  });
};


//get all users
exports.getAllUsers = factory.getAll(User);

//get one user
exports.getUser = factory.getOne(User);

//update user
//DO NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);

//delete user
exports.deleteUser = factory.deleteOne(User);
