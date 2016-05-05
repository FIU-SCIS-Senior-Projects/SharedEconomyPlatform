var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


router.get('/', function(req, res, next) {
    res.render('login', {
        title: 'HyperDesk - Sign-in',
        usernameError: req.flash('error')
    });
});

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'loginUsername',
    passwordField: 'loginPassword'
    },
    function(username, password, done){
        User.getUserByUsername(username, function(error, user){
            if(error) return done(error);
            if(!user){
                console.log("User " + username + " not found.");
                return done(null, false, {message: "Invalid username."});
            }

            User.comparePasswords(password, user.password, function(err, isMatch){
                if(err) return done(err);
                if(isMatch){
                    console.log(user);
                    delete user.password;
                    return done(null, user);
                }else{
                    console.log("Invalid password.")
                    return done(null, false, {message: "Invalid password."});
                }
            });
        });
    }
));
router.post('/', passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}), function (req, res) {
    res.redirect(req.session.returnTo || '/');
    delete req.session.returnTo;
});

module.exports = router;
