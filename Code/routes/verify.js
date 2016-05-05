var express = require('express');
var router = express.Router();
var TempUser = require('../models/tempuser');
var ResetPassUser = require('../models/resetpassuser');
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.location('/');
    res.redirect('/');

    //for testing verify.hbs styles
    //req.flash('registrationAttempt', 'Thanks for registering ' + req.body.registerFirstName + "! We've sent you a verification e-mail to " + req.body.registerEmail + ". Please verify your account within 48 hours.");
    //res.render('verify', {
    //    verifyMessage: "Thanks for registering We've sent you a verification e-mail to blah blah blah"
    //});
});

router.get('/:verificationId', function(req, res, next) {
    var verificationId = req.params.verificationId;

    if(verificationId == "OneMoreStep"){//user sent here after registering
        res.render('verify', {
            title: 'HyperDesk - Verify',
            verifyMessage: req.flash('registrationAttempt')
        });
    }else if(verificationId.length != 10){//not a valid verification id
        res.location('/');
        res.redirect('/');
    } else { //verify account
        TempUser.getTempUserByVerificationIdAndRemove(verificationId, function(error, tempUser){
            if(error){
                console.log("getTempUserByVerifyString error:");
                console.log(error);
                //Redirect to home page
                res.location('/');
                res.redirect('/');
            }
            if(!tempUser){
                //Tempuser doesn't exist

                req.flash('verifyExpired', 'Sorry, this verification link has expired. Please register again.');
                res.location('/register');
                res.redirect('/register');
            }else{//Temp user found
                var newUser = new User({
                    firstName: tempUser.firstName,
                    lastName: tempUser.lastName,
                    fullName: tempUser.fullName,
                    username: tempUser.username,
                    password: tempUser.password,
                    email: tempUser.email,
                    joinDate: tempUser.joinDate
                });

                User.createUser(newUser, function(err, user){

                    if(err || !user){
                        console.log("Error in createUser:");
                        console.log(error);
                        res.location('/register');
                        res.redirect('/register');
                    }

                    //Successfully created new user
                    req.flash('verifySuccess', 'Thanks for verifying you account ' + req.body.registerFirstName + '! You may now log in.');
                    res.location('/login');
                    res.redirect('/login');
                });
            }
        });
    }
});

module.exports = router;
