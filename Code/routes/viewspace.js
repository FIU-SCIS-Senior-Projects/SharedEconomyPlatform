var express = require('express');
var router = express.Router();
var Space = require('../models/space');
var Review = require('../models/review');
var moment = require('moment');
var Image = require('../models/image');
var User = require('../models/user');

router.get('/', function (req, res, next) {
    res.location('/');
    res.redirect('/');

});

router.get('/:id', function (req, res, next) {
    var id = req.params.id;

    var tooltipMap = {
        Wifi: "Wifi", FoodCourt: "FoodCourt Available", WheelChair: "Wheelchair Accessible",
        MeetingRoom: "Meeting Rooms", Kitchen: "Kitchen Available", Mail: "Mail Service", Coffee: "Coffee Machine",
        Parking: "Parking Available"
    };
    var classMap = {
        Wifi: "uk-icon-wifi", FoodCourt: "uk-icon-cutlery", WheelChair: "uk-icon-wheelchair",
        MeetingRoom: "uk-icon-group", Kitchen: "uk-icon-spoon", Mail: "uk-icon-envelope", Coffee: "uk-icon-coffee",
        Parking: "uk-icon-car"
    };

    console.log(id);

    if (!id.match(/^[0-9a-fA-F]{24}$/)) { // check if valid id object
        res.redirect('/'); //redirect to home page

    }
    else {

        Space.getSpaceById(id, function (err, space) {

            if (err)
                throw err;
            else if (!space) { //space doesn't exist in db
                res.redirect('/'); //redirect to home page
            }
            else { //display space info


                Image.findImagesByIds(space.images, function (err, images) {

                    // get images ready
                    var imageArray = [];

                    for (var i in images) {
                        var base64Img = images[i].img.data.toString('base64');
                        imageArray.push(base64Img);
                    }

                    //get the reviews
                    Review.getReviewsById(id, function (error, reviews) {
                        if (error)
                            throw error;

                        var features = space.features;
                        var featuresArray = []

                        for (var i = 0; i < features.length; i++) {
                            featuresArray.push({tooltip: tooltipMap[features[i]], class: classMap[features[i]]});
                        }

                        User.getUserById(space.owner, function (err, user) {

                            if (err)
                                throw err;

                            console.log(space.loc[0], space.loc[1]);
                            res.render('viewspace', {
                                title: 'HyperDesk - View Space',
                                spaceName: space.name,
                                spaceType: space.type,
                                spaceNumber: space.phone,
                                spaceEmail: space.email,
                                spaceWebsite: space.website,
                                spaceFloors: space.floors,
                                spaceRooms: space.rooms,
                                spaceDesks: space.desks,
                                spaceSquareFeet: space.floorSpace,
                                spaceDescription: space.description,
                                perDay: space.perDay,
                                perHour: space.perHour,
                                perMonth: space.perMonth,
                                hoursOfOperation: space.hoursOfOperation,
                                mondayOpen: space.hoursOfOperation.monday.open,
                                mondayClosed: space.hoursOfOperation.monday.close,
                                tuesdayOpen: space.hoursOfOperation.tuesday.open,
                                tuesdayClosed: space.hoursOfOperation.tuesday.close,
                                wednesdayOpen: space.hoursOfOperation.wednesday.open,
                                wednesdayClosed: space.hoursOfOperation.wednesday.close,
                                thursdayOpen: space.hoursOfOperation.thursday.open,
                                thursdayClosed: space.hoursOfOperation.thursday.close,
                                fridayOpen: space.hoursOfOperation.friday.open,
                                fridayClosed: space.hoursOfOperation.friday.close,
                                saturdayOpen: space.hoursOfOperation.saturday.open,
                                saturdayClosed: space.hoursOfOperation.saturday.close,
                                sundayOpen: space.hoursOfOperation.sunday.open,
                                sundayClosed: space.hoursOfOperation.sunday.close,
                                feature: featuresArray,
                                averageRating: Math.round(space.averageRating * 10) / 10,
                                totalReviews: space.numberOfReviews,
                                id: id,
                                reviews: reviews.reverse(),
                                owner: space.owner,
                                images: imageArray,
                                longitude: space.loc[0],
                                latitude: space.loc[1],
                                username: user.username

                            });

                        });

                    });


                });

            }
        });

    }

});

module.exports = router;
