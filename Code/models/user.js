var mongoose = require('mongoose');
//var db = mongoose.connection;
var bcrypt = require('bcrypt-nodejs');
var Space = require('../models/space');
var Review = require('../models/review');
var Image = require('../models/image');

//User Schema
var UserSchema = mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    fullName: {
        type: String
    },
    username: {
        type: String,
        index: true
    },
    password: {
        type: String,
        required: true,
        bcrypt: true
    },
    email: {
        type: String,
        index: true
    },
    bio: {
        type: String
    },
    profilePic: {
        type: String
    },
    lastFourCard: {
        type: String
    },
    cardType: {
        type: String
    },
    customerId: { //from stripe
        type: String
    },
    accountId: { // from stripe
        type: String
    },
    joinDate: { type: Date, default: Date.now }
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
    newUser.save(callback);
};

module.exports.getUserByUsername = function(username, callback){
    User.findOne({username: username}, callback);
};

module.exports.getUserByEmail = function(email, callback){
    User.findOne({email:email}, callback);
};

module.exports.getUserById = function(id, callback){
    User.findOne({_id: id}, callback);
};

module.exports.comparePasswords = function(candidatePassword, hashedPassword, callback){
    bcrypt.compare(candidatePassword, hashedPassword, function(error, isMatch){
        if(error) return callback(error);
        else{
            callback(null, isMatch);
        }
    });
};
module.exports.changePassword = function (email, password, callback) {

    console.log("in changepassword");

    bcrypt.genSalt(10, function (err, salt) {
        if (err)throw err;
        bcrypt.hash(password, salt, null, function (err, hash) {
            if (err) throw err;
            User.update({email: email}, {$set: {password: hash}}, callback);
        });
    });
};

module.exports.changePasswordById = function (id, password, callback) {

    console.log("in changepassword");

    bcrypt.genSalt(10, function (err, salt) {
        if (err)throw err;
        bcrypt.hash(password, salt, null, function (err, hash) {
            if (err) throw err;
            console.log("password is now: " + hash);
            User.update({_id: id}, {$set: {password: hash}}, callback);
        });
    });
};

module.exports.updateFullName = function (id, newName, callback) {
    User.update({_id: id}, {$set: {fullName: newName}}, callback);
};

module.exports.updateCardInfo = function (id, type, last4, callback) {
    User.update({_id: id}, {$set: {cardType: type, lastFourCard: last4}}, callback);
};

module.exports.updateCustomerId = function (id, customerId, callback) {
    User.update({_id: id}, {$set: {customerId: customerId}}, callback);
};

module.exports.setManagedAccountToken = function (id, token, callback) {
    User.update({_id: id}, {$set: {accountId: token}}, callback);
};

module.exports.updateBio = function (id, newBio, callback) {
    User.update({_id: id}, {$set: {bio: newBio}}, callback);
};

module.exports.updateEmail = function (id, newEmail, callback) {
    User.update({_id: id}, {$set: {email: newEmail}}, callback);
};

module.exports.updateProfilePic = function (id, newPic, callback) {
    User.update({_id: id}, {$set: {profilePic: newPic}}, callback);
};

module.exports.updateUsername = function (id, newUsername, callback) {
    User.update({_id: id}, {$set: {username: newUsername}}, callback);
};

module.exports.deleteAccount = function (id, callback) {
    User.remove({_id: id}, function () {
        console.log("Remmove user");
        //get the space
        Space.getSpacesByOwner(id, function (err, spaces) {
            if (err)
                throw err;

            for (var i = 0; i < spaces.length; i++) { // do this for each space
                var images = spaces[i].images;
                console.log(images);
                var spaceId = spaces[i]._id;
                console.log("in loop");
                Image.deleteImagesByIds(images);

            }

            Review.removeSpaceReviews(spaceId, function () {
                Space.removeSpacesByOwner(id, callback); //remove all spaces from the user
            });
        }); // delete the images from that space

    });


};