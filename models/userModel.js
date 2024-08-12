const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');


//Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
        trim: true
    },

    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
      },

    photo: {
        type: String,
        // required: [true, 'A user must have a photo']
    },

    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'password must have at least 8 characters'],
        select: false
    },

    passwordConfirm: {
        type: String,
        required: [true, 'please confirm password'],
        validate: {
            // This only works on CREATE and SAVE!!! not findOneAndUpdate
            validator: function(el) {
              return el === this.password;
            },
            message: 'Passwords are not the same!'
          }
    },

    passwordChangedAt: {
        type: Date,
        default: Date.now()
    },

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


//Password encryption
userSchema.pre('save', async function(next) {
    // do not run this function if password is not modified
    if (!this.isModified('password')) return next();
  
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
  
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});


//To compare provided password and original password for login authentication
userSchema.methods.correctPassword = async function (candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
};


//To check if password has been changed after receving token
userSchema.methods.passwordChangedAfter = function(JWTTimeStamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimeStamp < changedTimeStamp;
    }

    //false here means NOT changed
    return false;
}

//Creating a model out of the schema
const User = mongoose.model('User', userSchema);

module.exports = User;