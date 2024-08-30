const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

//multer storage
//use this approach if your app does not need image resizing and compression;
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) =>{
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) =>{
//     const ext = file.mimetype.split('/')[1];
//     //the file name has to be "user-userId-timeStamp", to have a unique file name.
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

//to store image in memory (as a buffer) for compression and resizing before saving
const multerStorage = multer.memoryStorage();

//multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image. Please upload only images.", 400));
  }
};

//image upload screening area
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// to finally upload image file
exports.uploadUserPhoto = upload.single("photo");

//to resize and compress image with 'sharp'
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  //req.file.filename is defined here because at this point, 'file' is not yet present in the req object.
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //retreiving image from memory
  await sharp(req.file.buffer)
    //crop image to 500px by 500px
    .resize(500, 500)
    //set format to jpeg
    .toFormat("jpeg")
    //compress to reduce file size
    .jpeg({ quality: 90 })
    //write to this directory
    .toFile(`public/img/users${req.file.filename}`);

  next();
});

// To filter out fields that users are not allowed to update.
const filterObj = (obj, ...allowedFields) => {
  //empty object to collect filtered fields
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
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
        "This route is not for password update, please use /update-password.",
        400
      )
    );
  }

  // 2) filter out fields that users are not allowed to update.
  const filteredBody = filterObj(req.body, "name", "email");

  //to add updated photo to the request body when a user updates their image
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findOneAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

//To let a logged in user delete their accout
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

//to let a logged in user view themselves.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

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
