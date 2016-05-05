var express = require('express');
var router = express.Router();
var Space = require('../models/space');
var Rented = require('../models/rented');
var Offer = require('../models/offer');
var User = require('../models/user');
var stripe = require('stripe')('sk_test_Nr4zTr6IMuiKXn2Q4fkDoxRe');
var nodemailer = require('nodemailer');
var config = require('../config/config');
var email = require('../config/emailprop');

router.post('/submit', function (req, res, next) {

    var token = req.body.stripeToken;
    var price = req.body.price;
    var username = req.user.username;
    var ownerId = req.body.ownerId;
    var spaceId = req.body.spaceId;
    var availability = {};
    var type = req.body.type;

    if (type == "hourly") {

        var date = req.body.date;
        var hours = req.body.hours;

        User.getUserById(ownerId, function (err, user) {
            //do the charge here
            console.log(user);

            var charge = stripe.charges.create({
                amount: price * 100, // amount in cents, again
                currency: "usd",
                source: token,
                description: "Example charge",
                destination: user.accountId
            }, function (err, charge) {
                if (err && err.type === 'StripeCardError') {
                    res.status(200).send({
                        code: 200,
                        message: err.message,
                        error: 1
                    });

                }
                else {

                    //parse hours string to array
                    var hoursArray = hours.split(",");
                    hoursArray.splice(hoursArray.length - 1, 1);

                    availability[date] = hoursArray;

                    //update availability for that space
                    Space.updateAvailabilityHours(spaceId, date, hoursArray, function (err, space) {
                        if (err)
                            throw err;

                    });

                    //insert it into the rented table
                    var newRented = new Rented({
                        renterUsername: username,
                        spaceId: spaceId,
                        dates: date,
                        hours: hoursArray,
                        price: price,
                        type: type
                    });

                    Rented.createRented(newRented, function (err, rented) {

                        if (err)
                            throw err;


                    });

                    // delete any offers for those hours if they exist in the offer table
                    Offer.getOffersBySpaceId(spaceId, function (err, offers) {

                        var found = false;

                        if (err)
                            throw err;

                        for (var key in offers) {

                            if (offers[key].dates.length == 1 && offers[key].dates[0] == date) {
                                var theHours = offers[key].hours;

                                for (var i = 0; i < theHours.length; i++) {
                                    if (theHours.indexOf(hoursArray[i]) != -1) {
                                        Offer.deleteOffer(offers[key]._id, function (err, offer) {
                                            if (err)
                                                throw error;
                                            found = true;
                                        });
                                    }
                                    if (found)
                                        break;
                                }
                            }
                            else if (offers[key].dates.length != 1) {
                                var theDates = offers[key].dates;

                                for (var i = 0; i < theDates.length; i++) {
                                    if (theDates.indexOf(date) != -1) {

                                        Offer.deleteOffer(offers[key]._id, function (err, offer) {
                                            if (err)
                                                throw error;
                                            found = true;
                                        });
                                    }

                                    if (found)
                                        break;
                                }
                            }
                        }

                    });


                    //get the space
                    Space.getSpaceById(spaceId, function (err, space) {
                        if (err)
                            throw error;

                        //email the user
                        var transporter = nodemailer.createTransport({
                            service: email.service,
                            auth: email.auth
                        });

                        //send email
                        var mailOptions = {
                            from: email.from,
                            to: req.user.email,
                            subject: 'Space Rental Details',
                            html: "<b>Hi " + req.user.firstName + ",</b><br>" +
                            "<p>Congratulations! You have rented the office space " + space.name + ".</p><br>" +
                            "<p><b>Details:</b></p>" +
                            "<p><b>Date: </b>" + date + ".</p>" +
                            "<p><b>Hours: </b>" + hoursArray.toString() + ".</p>" +
                            "<p><b>Contact Number: </b>" + space.phone + ".</p>" +
                            "<p>Please arrive 15 minutes prior to your rental time.</p>" +
                            "<p>-HyperDesk team</p>"
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log("Error sending rent email.");
                                console.log(error);
                            } else {
                                res.status(200).send({
                                    code: 200,
                                    message: "Thank you for your payment! We have sent you an email containing the details" +
                                    " of your rental."
                                });
                            }
                        });

                    });

                }


            });
        });


    }
    else if (type == "daily") {

        var dates = req.body.dates;

        ////parse dates string to array
        var datesArray = dates.split(",");


        //do the charge here
        User.getUserById(ownerId, function (err, user) {
            if (err)
                throw err;

            var charge = stripe.charges.create({
                amount: price * 100, // amount in cents, again
                currency: "usd",
                source: token,
                description: "Example charge",
                destination: user.accountId
            }, function (err, charge) {
                if (err && err.type === 'StripeCardError') {
                    res.status(200).send({
                        code: 200,
                        message: err.message,
                        error: 1
                    });

                }
                else {

                    Space.getSpaceById(spaceId, function (err, space) {
                        if (err)
                            throw error;


                        Space.updateAvailabilityDates(space, datesArray, function (err) {

                            if (err)
                                throw error;

                        });

                        //email the user
                        var transporter = nodemailer.createTransport({
                            service: email.service,
                            auth: email.auth
                        });

                        //send email
                        var mailOptions = {
                            from: email.from,
                            to: req.user.email,
                            subject: 'Space Rental Details',
                            html: "<b>Hi " + req.user.firstName + ",</b><br>" +
                            "<p>Congratulations! You have rented the office space " + space.name + ".</p><br>" +
                            "<p><b>Details:</b></p>" +
                            "<p><b>Dates: </b>" + dates.toString() + ".</p>" +
                            "<p><b>Contact Number: </b>" + space.phone + ".</p>" +
                            "<p>Please arrive 15 minutes prior to your rental time.</p>" +
                            "<p>-HyperDesk team</p>"
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log("Error sending rent email.");
                                console.log(error);
                            } else {
                                res.status(200).send({
                                    code: 200,
                                    message: "Thank you for your payment! We have sent you an email containing the details" +
                                    " of your rental."
                                });
                            }
                        });

                    });

                }
            });

        });


    }


});

module.exports = router;