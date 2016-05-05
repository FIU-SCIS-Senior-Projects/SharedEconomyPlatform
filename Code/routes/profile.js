var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Space = require('../models/space');
var TempUser = require('../models/tempuser');
var Image = require('../models/image');
var extend = require('extend');
var moment = require('moment');
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
var stripe = require('stripe')('sk_test_Nr4zTr6IMuiKXn2Q4fkDoxRe');


router.get('/', function (req, res, next) {
    res.location('/');
    res.redirect('/');

});

router.get('/:id', function (req, res, next) {
    var id = req.params.id;
    var theUser;
    console.log("in here");

    if (req.user) { //if this is a valid user viewing the page
        theUser = req.user.username; //set this to check if they are on their own page
    }
    User.getUserByUsername(id, function (err, user) {

        if (err)
            throw err;

        if (!user) {
            res.location('/');
            res.redirect('/');
        }
        else {
            console.log(user);

            Space.getSpacesByOwner(user._id, function (err, spaces) {

                if (err)
                    throw err;

                var spaceToImageMap = {},
                    imageIDArray = [];

                for (var i in spaces) {
                    var imageId = spaces[i].images[0],
                        spaceId = spaces[i]._id;
                    imageIDArray.push(imageId);

                    spaceToImageMap[spaceId] = imageId;

                }


                Image.findImagesByIds(imageIDArray, function (err, images) {

                    var spaceResults = [],
                        imageMap = {};

                    //map images to their id
                    for (var i in images) {
                        var imageId = images[i]._id;
                        imageMap[imageId] = images[i];
                    }

                    for (var i = 0; i < spaces.length; i++) {
                        var spaceTocopy = spaces[i].toObject(); //We must convert from mongo document to regular object to be able to extend
                        var imageToCopyId = spaceToImageMap[spaceTocopy._id];
                        var base64Img = imageMap[imageToCopyId].img.data.toString('base64');


                        var spaceInfo = {
                            rating: spaces[i].averageRating,
                            spaceId: spaces[i]._id,
                            title: spaces[i].name,
                            description: spaces[i].description,
                            img: base64Img
                        };
                        spaceResults.push(spaceInfo);

                    }


                    if (user.profilePic) { // if a profile pic exists then find the pic

                        Image.findImageById(user.profilePic, function (err, profilePic) {

                            console.log(profilePic);

                            var pic = profilePic.img.data.toString('base64');

                            console.log(user.lastFour);


                            res.render('Profile', {
                                title: 'HyperDesk - Profile',
                                results: spaceResults,
                                name: user.fullName,
                                username: user.username,
                                email: user.email,
                                joined: moment(user.joinDate).format('MMMM Do YYYY'),
                                firstName: user.firstName,
                                bio: user.bio,
                                pic: pic,
                                profileOwner: theUser == user.username,
                                lastFour: user.lastFourCard,
                                type: user.cardType
                            });

                        });

                    }
                    else {
                        res.render('Profile', {
                            title: 'HyperDesk - Profile',
                            results: spaceResults,
                            name: user.fullName,
                            username: user.username,
                            email: user.email,
                            joined: moment(user.joinDate).format('MMMM Do YYYY'),
                            firstName: user.firstName,
                            bio: user.bio,
                            pic: null,
                            profileOwner: theUser == user.username,
                            lastFour: user.lastFourCard,
                            type: user.cardType
                        });
                    }

                });

            });
        }

    });

});

router.post('/saveCard', function (req, res, next) {


    User.updateCardInfo(req.user._id, req.body.cardType, req.body.last4, function (err, user) {

        if (!req.user.customerId) { //if first time saving details

            stripe.customers.create({ // create a customer
                description: req.user.username,
                source: req.body.stripeToken // obtained with Stripe.js
            }, function (err, customer) {

                if (err)
                    console.log(err);

                //update the customer ID
                User.updateCustomerId(req.user._id, customer.id, function (err, user) {
                    if (err)
                        throw err;

                    res.status(200).send({
                        code: 200, message: "Updated the card."
                    });
                });
            });
        }
        else { // just update the customer
            stripe.customers.update(req.user.customerId, {
                source: req.body.stripeToken // obtained with Stripe.js
            }, function (err, customer) {
                if (err)
                    throw err;

                res.status(200).send({
                    code: 200, message: "Updated the card."
                });

                console.log(customer);
            });
        }

    });

});

router.post('/check/username', function (req, res, next) {

    //check if user name already exists
    User.getUserByUsername(req.body.username, function (err, user) {
        if (err)
            throw err;

        if (!user) {
            //check tempuser table
            TempUser.getTempUserByUsername(req.body.username, function (err, tempuser) {

                if (tempuser) { //temp user exists
                    res.status(200).send({
                        code: 200, message: "Sorry. that username is taken."
                    });
                }
                else {
                    res.status(200).send({
                        code: 200, message: null
                    });
                }

            });

        }
        else { //user exists
            res.status(200).send({
                code: 200, message: "Sorry. that username is taken."
            });
        }
    });

});

router.post('/check/email', function (req, res, next) {

    //check if user name already exists
    User.getUserByEmail(req.body.email, function (err, user) {
        if (err)
            throw err;

        if (!user) {
            //check tempuser table
            TempUser.getTempUserByEmail(req.body.email, function (err, tempuser) {

                if (tempuser) { //temp user exists
                    res.status(200).send({
                        code: 200, message: "Sorry. that email is already registered."
                    });
                }
                else {
                    res.status(200).send({
                        code: 200, message: null
                    });
                }

            });

        }
        else { //user exists
            res.status(200).send({
                code: 200, message: "Sorry. that email is already registered."
            });
        }
    });

});

router.post('/', upload.single('photo'), function (req, res, next) {
    console.log("got post request");
    console.log(req.body);


    if (req.body.name) { //update the name field


        User.updateFullName(req.user._id, req.body.name, function (err, user) {

            if (err)
                throw err;

        });
    }
    else if (req.body.bio || req.body.bio == '') { //update the bio field

        console.log(req.user._id);

        User.updateBio(req.user._id, req.body.bio, function (err, bio) {

            if (err)
                throw err;

        });
    }
    else if (req.file) { // update the profile pic
        var image = req.file;
        console.log(image);

        var imageToUpload = new Image({
            img: {
                data: image.buffer,
                contentType: image.mimetype,
                size: image.size
            },
            filename: image.originalname
        });

        Image.createImage(imageToUpload, function (error, savedImage) {
            if (error) {
                throw error;
            }


            User.updateProfilePic(req.user._id, savedImage._id, function (error, theImage) {
                if (error) {
                    throw error;
                }

            });

        });

    }
    else if (req.body.username) { //update the username

        User.updateUsername(req.user._id, req.body.username, function (err, user) {

            if (err)
                throw err;
            console.log(user);

        });
    }
    else if (req.body.password) { //update the username

        User.changePasswordById(req.user._id, req.body.password, function (err, user) {

            if (err)
                throw err;
            res.status(200).send({
                code: 200, message: "Password changed!"
            });

            console.log(user);

        });
    }
    else if (req.body.del) { //user wants to delete their account

        User.deleteAccount(req.user._id, function (err, user) {
            if (err)
                throw err;

            console.log(user);
            res.status(200).send({
                code: 200, message: "Account Deleted!"
            });

        });

    }
    else if (req.body.email) { //user wants to edit email

        User.updateEmail(req.user._id, req.body.email, function (err, user) {
            if (err)
                throw err;

        });

    }


});

module.exports = router;

