var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');

//ResetPassUser Schema
var ResetPassUserSchema = mongoose.Schema({
    email: {
        type: String,
        index: true
    },
    verificationId: {type: String, index: true},
    createdAt: {type: Date, default: Date.now, index: {expires: '24h'}}
});

var ResetPassUser = module.exports = mongoose.model('ResetPassUser', ResetPassUserSchema);


module.exports.createResetPassUser = function (newResetPassUser, callback) {
    newResetPassUser.save(callback);
};

//If user is found, user is returned and deleted from ResetPassUser table
module.exports.getUserByVerificationId = function (string, callback) {
    ResetPassUser.findOne({verificationId: string}, callback);
};

module.exports.getResetPassUserByEmail = function (email, callback) {
    User.getUserByEmail(email, callback);
};
module.exports.getResetPassUserByVerificationIdAndRemove = function (id, callback) {
    ResetPassUser.findOneAndRemove({verificationId: id}, callback);
};
