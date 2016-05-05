var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//User Schema
var TempUserSchema = mongoose.Schema({
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
    joinDate: { type: Date, default: Date.now },
    verificationId: { type: String, index: true },
    createdAt: { type: Date, default: Date.now, index: { expires: '48h' } }
});

var TempUser = module.exports = mongoose.model('TempUser', TempUserSchema);


module.exports.createTempUser = function(newUser, callback){

    bcrypt.genSalt(10, function(err, salt){
        if(err)throw err;
        bcrypt.hash(newUser.password, salt, null, function(err, hash) {
            if(err) throw err;
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.getTempUserByUsername = function(username, callback){
    TempUser.findOne({username:username}, callback);
};

module.exports.getTempUserByEmail = function(email, callback){
    TempUser.findOne({email:email}, callback);
};

//If user is found, user is returned and deleted from Temp User table
module.exports.getTempUserByVerificationIdAndRemove = function(string, callback){
    TempUser.findOneAndRemove({ verificationId: string }, callback);
};