var express = require('express');
var nodemailer = require('nodemailer');
var router = express.Router();
var TempUser = require('../models/tempuser');
var randomString = require('random-string');
var email = require('../config/emailprop');
var config = require('../config/config');

router.get('/', function(req, res, next) {
    res.render('register', {title: 'HyperDesk - Register'});
});

router.post('/', function(req, res, next){

    //Form validation
    //is required
    req.checkBody('registerFirstName', 'First Name field is required.').notEmpty();
    req.checkBody('registerLastName', 'Last Name field is required.').notEmpty();
    req.checkBody('registerEmail', 'Email field is required.').notEmpty();
    req.checkBody('registerUsername', 'Username field is required.').notEmpty();
    req.checkBody('registerPassword', 'Password field is required.').notEmpty();

    //is valid email
    req.checkBody('registerEmail', 'Email not valid.').isEmail();

    //is proper format
    req.checkBody('registerFirstName', 'First name must only contain letters.').isAlpha();
    req.checkBody('registerLastName', 'Last name must only contain letters.').isAlpha();
    req.checkBody('registerUsername', 'Username must only contain letters and numbers.').isAlphanumeric();
    //req.checkBody('registerPassword', 'Password must have at least one letter and may contain numbers or symbols').isAscii().hasLetter();

    //no whitespace
    req.checkBody('registerPassword', 'Password may not contain spaces.').hasNoWhiteSpace();

    //is proper length
    req.checkBody('registerFirstName', 'First Name may have up to 20 characters.').isLength({max:20});
    req.checkBody('registerLastName', 'Last Name may have up to 20 characters.').isLength({max:20});
    req.checkBody('registerUsername', 'Username must be 3 - 20 characters long.').isLength({min: 3, max:20});
    req.checkBody('registerPassword', 'Password must be 6 - 50 characters long.').isLength({min:6, max:50});

    //is available
    req.checkBody('registerEmail', 'An account with that e-mail already exists.').canEmailRegister();
    req.checkBody('registerUsername', 'Sorry, that username is already taken.').isUsernameAvailable();

    //matching passwords
    req.checkBody('registerPassword2', 'Passwords do not match.').equals(req.body.registerPassword);


    //Check for errors
    //Asynchronouse validation due to the availability checks having to query db
    req.asyncValidationErrors().then(function(){//No validation errors
        //Create User from register form values
        var newUser = new TempUser({
            firstName: req.body.registerFirstName,
            lastName: req.body.registerLastName,
            fullName: req.body.registerFirstName + " " + req.body.registerLastName,
            email: req.body.registerEmail,
            username: req.body.registerUsername,
            password: req.body.registerPassword,
            verificationId: randomString({length: 10})
        });

        TempUser.createTempUser(newUser, function(error, tempUser){
            if(error) throw error;

            console.log("Temp User created.");
            console.log(tempUser);

            var transporter = nodemailer.createTransport({
                service: email.service,
                auth: email.auth
            });

            var mailOptions = {
                from: email.from,
                to: tempUser.email,
                subject: 'Account verification e-mail.',
                html: "<b>Hi " + tempUser.firstName + "!</b><br>" +
                "<p>Thanks for joining HyperDesk. We know you're eager to find your next work space!</p><br>" +
                        "<p>Before you do that though, click the link below or paste it into your browser to verify your new account and get started!</p><br>" +
                        "<a href='" + config.websiteProperties.url + "/verify/"+ tempUser.verificationId +"'>" + config.websiteProperties.url + "/verify/" + tempUser.verificationId +"</a><br>" +
                "<p>-HyperDesk Team</p>"
            };

            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log("Error sending verification e-mail.");
                    console.log(error);
                    res.location('/register');
                    res.redirect('/register');
                }else{
                    console.log('Message sent: ' + info.response);
                    //success message
                    req.flash('registrationAttempt', 'Thanks for registering ' + req.body.registerFirstName + "! We've sent you a verification e-mail to " + req.body.registerEmail + ". Please verify your account within 48 hours before logging in.");
                    res.location('/verify/OneMoreStep');
                    res.redirect('/verify/OneMoreStep');
                }
            });
        });
    }).catch(function(errors) {//Registration has validation errors
        var errorMap = {};
        errors.forEach(function(error){
            errorMap[error.param] = error.msg;
        });

        res.render('register', {
            title: 'HyperDesk - Register',
            firstNameError: errorMap.registerFirstName,
            lastNameError: errorMap.registerLastName,
            emailError: errorMap.registerEmail,
            usernameError: errorMap.registerUsername,
            passwordError: errorMap.registerPassword,
            password2Error: errorMap.registerPassword2,
            registerFirstName: req.body.registerFirstName,
            registerLastName: req.body.registerLastName,
            registerEmail: req.body.registerEmail,
            registerUsername: req.body.registerUsername,
            registerPassword: req.body.registerPassword,
            registerPassword2: req.body.registerPassword2
        });
    });

});
module.exports = router;
