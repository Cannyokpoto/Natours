const catchAsync = require('./../utils/catchAsync')
const User = require("./../models/userModel");

//get all users
exports.getAllUsers = catchAsync( async (req, res, next) =>{

    const users = await User.find();

    console.log(req.headers);

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    })
});


//get one user
exports.getUser = (req, res) =>{
    res.status(500).json({
        status: 'error',
        message: 'This route has not yet been defined!'
    })
}

//create user
exports.createUser = (req, res) =>{
    res.status(500).json({
        status: 'error',
        message: 'This route has not yet been defined!'
    })
}

//update user
exports.updateUser = (req, res) =>{
    res.status(500).json({
        status: 'error',
        message: 'This route has not yet been defined!'
    })
}

//delete user
exports.deleteUser = (req, res) =>{
    res.status(500).json({
        status: 'error',
        message: 'This route has not yet been defined!'
    })
}