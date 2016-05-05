var express = require('express');
var router = express.Router();
var moment = require('moment');
var Space = require('../models/space');
var Offer = require('../models/offer');
var AcceptedOffer = require('../models/acceptedOffer');
var stripe = require('stripe')('sk_test_Nr4zTr6IMuiKXn2Q4fkDoxRe');



router.post('/myoffers', function (req, res, next) {
    var userId = req.body.userId,
        acceptedSkip = req.body.acceptedSkip,
        pendingSkip = req.body.pendingSkip;

    Offer.findBySpaceOwnerAndPopulate({id: userId, skip: pendingSkip}, function(err, pendingOffers){
        AcceptedOffer.findBySpaceOwnerAndPopulate({id: userId, skip: acceptedSkip}, function(err, acceptedOffers){
            var accepted = [], pending = [];

            for(var i = 0; i < pendingOffers.length; i++){
                var offer = {
                    offerId: pendingOffers[i]._id,
                    offerOwner: {
                        id : pendingOffers[i].offerOwnerId._id,
                        fullName: pendingOffers[i].offerOwnerId.fullName
                    },
                    space: {
                        name: pendingOffers[i].spaceId.name,
                        id: pendingOffers[i].spaceId._id
                    },
                    offerDetails: {
                        amount: pendingOffers[i].offerAmount,
                        dateMade: moment(pendingOffers[i].created).format('MMMM Do YYYY, h:mm:ss a'),
                        type: pendingOffers[i].type,
                        dates: pendingOffers[i].dates,
                        hours: pendingOffers[i].hours
                    }


                };
                pending.push(offer);
            }

            for(var i = 0; i < acceptedOffers.length; i++){
                var offer = {
                    offerId: acceptedOffers[i]._id,
                    offerOwner: {
                        id : acceptedOffers[i].offerOwnerId._id,
                        fullName: acceptedOffers[i].offerOwnerId.fullName
                    },
                    space: {
                        name: acceptedOffers[i].spaceId.name,
                        id: acceptedOffers[i].spaceId._id
                    },
                    offerDetails: {
                        amount: acceptedOffers[i].offerAmount,
                        dateMade: moment(acceptedOffers[i].created).format('MMMM Do YYYY, h:mm:ss a'),
                        type: acceptedOffers[i].type,
                        dates: acceptedOffers[i].dates,
                        hours: acceptedOffers[i].hours
                    }


                };
                accepted.push(offer);
            }

            res.status(200).send({pending: pending, accepted: accepted});

        });
    });

});

router.post('/accept', function (req, res, next) {
    var offerId = req.body.offerId;
    console.log(offerId);
    Offer.findAndRemove(offerId, function(err, offer){
        console.log(offer);
        var acceptedOffer = new AcceptedOffer({
            offerOwnerId: offer.offerOwnerId,
            spaceOwnerId: offer.spaceOwnerId,
            spaceId: offer.spaceId,
            dates: offer.dates,
            hours: offer.hours,
            offerAmount: offer.offerAmount,
            stripeToken: offer.stripeToken,
            type: offer.type,
            created: offer.created
        });
        AcceptedOffer.createOffer(acceptedOffer, function(err, acceptedReturned){
            console.log(err);

            var offerToSend = {
                offerId: acceptedReturned._id,
                offerOwner: {
                    id : offer.offerOwnerId._id,
                    fullName: offer.offerOwnerId.fullName
                },
                space: {
                    name: offer.spaceId.name,
                    id: offer.spaceId._id
                },
                offerDetails: {
                    amount: offer.offerAmount,
                    dateMade: moment(offer.created).format('MMMM Do YYYY, h:mm:ss a'),
                    type: offer.type,
                    dates: offer.dates,
                    hours: offer.hours
                }

            };
            res.status(200).send({accepted: [offerToSend], deletedId: offerId});
        });
    });
});

router.post('/decline', function (req, res, next) {
    var offerId = req.body.offerId;
    console.log(offerId);
    Offer.findAndRemove(offerId, function(err, offer){
        var deletedOffer = offer.toObject();
        res.status(200).send({offerId: deletedOffer._id});
    });
});

router.post('/verify', function (req, res, next) {
    //if user is not logged in, redirect to login page
    //and take them back were they left off
    req.session.returnTo = "/viewspace/" + req.body.spaceId;
    res.redirect('/login');

});


//return the days to disable
router.post('/disable', function (req, res, next) {

    console.log("disabled method called");
    console.log(req.body.spaceId);

    //get the dates that are unavailable
    Space.getSpaceById(req.body.spaceId, function (error, space) {

        if (error)
            throw error;

        console.log(space);
        console.log(space.unavailableDates);
        res.send({unavailableDates: space.unavailableDates});

    });


});

//return the unavailable dates and the hours of operation to generate the unavailable hours
router.post('/unavailableHoursAndDays', function (req, res, next) {

    //get the hours of operation
    Space.getSpaceById(req.body.spaceId, function (error, space) {

        if (error)
            throw error;

        var hours = space.toObject().hoursOfOperation;
        var hoursArray = [];

        console.log(hours);
        console.log("start");


        Object.keys(hours).forEach(function (key) {
            console.log(hours[key]);
            hoursArray.push({open: hours[key].open, closed: hours[key].close})
        });


        res.send({
            unavailableDates: space.unavailableDates,
            hoursOfOperation: hoursArray.reverse(),
            unavailableHours: space.unavailableHours
        });

    });

});


router.post('/submit', function (req, res, next) {

    console.log("in post submit");

    //check if this is per hour, per day, or per month

    //get the values from the form
    var offerAmount = req.body.offerAmount;
    var datePerHour = req.body.datePerHour;
    var datePerDay = req.body.datePerDay;
    var datePerMonth = req.body.datePerMonth;
    var durationDays = req.body.durationDays;
    var durationMonths = req.body.durationMonths;
    var stripeToken = req.body.stripeToken;
    var username = req.user.username;
    var ownerId = req.body.ownerId;
    var spaceId = req.body.spaceId;

    console.log(req.body);


    var datesArray = [];
    var hoursArray = [];
    var type = "";

    if (datePerHour != '' && !datePerDay) { // if offer is per hour
        var hours = req.body.hours;

        //add the date to the array
        datesArray.push(datePerHour);

        console.log(datesArray);

        ////parse hours string to array
        hoursArray = hours.split(",");
        hoursArray.splice(hoursArray.length - 1, 1);
        console.log(hoursArray);

        type = "Hourly";


    }
    else if (datePerDay != '') { //if offer is per day
        var dates = req.body.days;

        ////parse dates string to array
        datesArray = dates.split(",");
        console.log(datesArray);


        console.log("in date per day if");
        type = "Daily";


    }


    console.log(username);
    //create the offer
    var newOffer = new Offer({
        offerOwnerId: req.user._id,
        spaceOwnerId: ownerId,
        spaceId: spaceId,
        dates: datesArray,
        hours: hoursArray,
        offerAmount: offerAmount,
        stripeToken: stripeToken,
        type: type
    });


    Offer.createOffer(newOffer, function (err, offer) {
        if (err)
            throw err;

        console.log(offer);

        res.status(200).send({
            code: 200, message: "Thank you for submitting an offer! Please wait while the lister reviews your offer." +
            " You will be notified when it is accepted or declined."
        });

    });


});



module.exports = router;


