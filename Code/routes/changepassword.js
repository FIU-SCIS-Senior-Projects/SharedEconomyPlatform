var express = require('express');
var router = express.Router();
var ResetPassUser = require('../models/resetpassuser');
var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.location('/');
    res.redirect('/');

});

router.get('/:verificationId', function (req, res, next) {
    var verificationId = req.params.verificationId;

    if (verificationId == "OneMoreStep") {//user sent here after resetting password
        res.render('verify', {
            title: 'ShareSpace - Change Password',
            verifyMessage: req.flash('resetPassAttempt')
        });
    } else if (verificationId.length != 30) {//not a valid reset id
        res.location('/');
        res.redirect('/');
    } else { //verify account
        ResetPassUser.getUserByVerificationId(verificationId, function (error, user) {
            if (error) {
                console.log("getResetPassUserByVerifyString error:");
                console.log(error);
                //Redirect to home page
                res.location('/');
                res.redirect('/');
            }
            if (!user) {
                //user doesnt exist
                req.flash('passResetExpired', 'Sorry, this password reset link has expired. Please reset again.');
                res.location('/resetpassword');
                res.redirect('/resetpassword');
            } else {//User found
                console.log("found user with that string");
                res.render('changepassword', {title: 'Share Space - Change Password', id: verificationId});

            }
        });
    }
});

module.exports = router;

router.post('/', function (req, res, next) {

    //Form validation
    //is required
    req.checkBody('newPassword', 'New password field is required.').notEmpty();

    //no whitespace
    req.checkBody('newPassword', 'Password may not contain spaces.').hasNoWhiteSpace();

    //is proper length
    req.checkBody('newPassword', 'Password must be 6 - 50 characters long.').isLength({min: 6, max: 50});

    //matching passwords
    req.checkBody('newPassword2', 'Passwords do not match.').equals(req.body.newPassword);

    // check for errors
    var errors = req.validationErrors();
    if (errors) {
        console.log("errors exist");
        var errorMap = {};
        errors.forEach(function (error) {
            errorMap[error.param] = error.msg;
        });

        res.render('changepassword', {
            title: 'ShareSpace - Change Password',
            newPasswordError: errorMap.newPassword,
            newPassword2Error: errorMap.newPassword2,
            newPassword: req.body.newPasswordError,
            newPassword2: req.body.newPassword2Error,
            id: req.body.changePassId
        });
    }
    else { // no errors
        console.log("no errors exist");
        console.log(req.body.changePassId);

        //find and remove from reset pass user table
        ResetPassUser.getResetPassUserByVerificationIdAndRemove(req.body.changePassId, function (error, user) {
            if (error)
                throw error;
            console.log("found user and removed");
            var email = user.email;
            var password = req.body.newPassword;
            console.log(email);

            User.changePassword(email, password, function (error, updatedUser) {
                if (error) {
                    console.log(error)
                    throw error;
                }
                console.log("Password changed");
                console.log(user);
                res.location('/login');
                res.redirect('/login');
            });


        });

    }


});

module.exports = router;

