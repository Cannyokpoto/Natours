const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { type } = require('os');


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

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


//middleware for Password encryption
userSchema.pre('save', async function(next) {
    // do not run this function if password is not modified
    if (!this.isModified('password')) return next();
  
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
  
    // Delete passwordConfirm property
    this.passwordConfirm = undefined;
    next();
});


//middleware to update the passwordChangedAt property for the user
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
  
    this.passwordChangedAt = Date.now() - 1000;
    next();
  });


  //middleware to exclude deleted users from queries, so they can only be visible in the DB
  userSchema.pre(/^find/, function(next) {
    // "this" points to the current query
    this.find({ active: { $ne: false } });
    next();
  });



//To compare provided password and original password for login authentication
userSchema.methods.correctPassword = async function (candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
};


//To check if password has been changed after receving token
userSchema.methods.passwordChangedAfter = function(JWTTimeStamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); //1000 converts to milli sec, 10 takes it to base 10

        return JWTTimeStamp < changedTimeStamp;
    }

    //false here means NOT changed
    return false;
}



//To create and hash token for password reset
                   
userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({ resetToken }, this.passwordResetToken)

    //10 is to make the token expire in 10 minutes. 60 is to convert it to seconds. 1000 converts it to milli seconds.
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};


//Creating a model out of the schema
const User = mongoose.model('User', userSchema);

module.exports = User;