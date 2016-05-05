var express = require('express');
var nodemailer = require('nodemailer');
var router = express.Router();
var randomString = require('random-string');
var email = require('../config/emailprop');
var config = require('../config/config');
var ResetPassUser = require('../models/resetpassuser');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('resetpassword', {title: 'HyperDesk - Forgot Password'});
});

router.post('/', function (req, res, next) {

    //Form validation
    //is required
    req.checkBody('resetPassEmail', 'Email is required.').notEmpty();

    //is valid email
    req.checkBody('resetPassEmail', 'Email not valid.').isEmail();

    //is available
    req.checkBody('resetPassEmail', 'E-mail does not exist.').isEmailRegistered();

    //Check for errors
    //Asynchronouse validation due to the availability checks having to query db
    req.asyncValidationErrors().then(function () {//No validation errors

        //Create ResetPassUser from reset password form value and verification string

        var newResetPassUser = new ResetPassUser({
            email: req.body.resetPassEmail,
            verificationId: randomString({length: 30})
        });


        ResetPassUser.createResetPassUser(newResetPassUser, function (error, resetPassUser) {
            if (error) throw error;

            console.log("ResetPassUser created.");
            console.log(resetPassUser);

            ResetPassUser.getResetPassUserByEmail(resetPassUser.email, function (error, user) {

                if (error) throw error;

                var transporter = nodemailer.createTransport({
                    service: email.service,
                    auth: email.auth
                });

                var mailOptions = {
                    from: email.from,
                    to: resetPassUser.email,
                    subject: 'Password Reset E-mail.',
                    html: "<b>Hi " + user.firstName + ",</b><br>" +
                    "<p>You have requested to reset your password.</p><br>" +
                    "<p>Please click the link below or paste it into your browser to proceed with the reset password process.</p><br>" +
                    "<a href='" + config.websiteProperties.url + "/changepassword/" + resetPassUser.verificationId + "'>" + config.websiteProperties.url + "/changepassword/" + resetPassUser.verificationId + "</a><br>" +
                    "<p>-HyperDesk team</p>"
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log("Error sending reset password e-mail.");
                        console.log(error);
                        res.location('/resetpassword');
                        res.redirect('/resetpassword');
                    } else {
                        console.log('Message sent: ' + info.response);
                        //success message
                        req.flash('resetPassAttempt', 'Thanks ' + user.firstName + "! We've sent you a reset password e-mail to " + user.email + ". Please reset within 48 hours.");
                        res.location('/changepassword/OneMoreStep');
                        res.redirect('/changepassword/OneMoreStep');
                    }
                });

            });

        });
    }).catch(function (errors) {//Reset Password has validation errors
        var errorMap = {};
        errors.forEach(function (error) {
            errorMap[error.param] = error.msg;
        });

        res.render('resetpassword', {
            title: 'ShareSpace - Forgot Password',
            emailError: errorMap.resetPassEmail,
            resetPassEmail: req.body.resetPassEmail
        });
    });

});

module.exports = router;


