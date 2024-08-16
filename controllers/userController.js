const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");


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


//get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  console.log(req.headers);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});




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


//get one user
exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route has not yet been defined!",
  });
};

//create user
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route has not yet been defined!",
  });
};

//update user
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route has not yet been defined!",
  });
};

//delete user
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route has not yet been defined!",
  });
};
