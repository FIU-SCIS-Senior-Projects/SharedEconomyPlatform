var express = require('express');
var async = require('async');
var extend = require('extend');
var Space = require('../models/space');
var Image = require('../models/image');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.render('search', {title: 'ShareSpace - Search'});
});

router.post('/', function (req, res, next) {

    //TODO: why do I have to set this? User should be available globally like it is for other pages.
    var user = req.user ? {
        username: req.user.username,
        profilePic: req.user.profilePic,
        email: req.user.email,
        fullName: req.user.fullName,
        lastName: req.user.lastName,
        firstName: req.user.firstName,
        _id: req.user._id,
        accountId: req.user.accountId,
        joinDate: req.user.joinDate
    } : undefined;


    var distance = req.body.distance / (6371 * (Math.PI / 180)),
        coordinates = [Number(req.body.lng), Number(req.body.lat)],
        numberOfResults = 20,
        minPrice = req.body.minPrice != "" ? req.body.minPrice : undefined,
        maxPrice = req.body.maxPrice != "" ? req.body.maxPrice : undefined,
        priceType = req.body.priceType,
        features = [];

    for (var key in req.body) {
        if (key.substring(0, 7) === "feature" && req.body[key] === "true") {
            features.push(key.substring(7, key.length));
        }
    }

    var query = {
        location: {
            coordinates: coordinates,
            distance: distance
        },
        price: minPrice && maxPrice ? {
            min: minPrice,
            max: maxPrice
        } : undefined,
        priceType: priceType,
        features: features,
        limit: numberOfResults

    };


    Space.queryBuild(query, function (err, locations) {

        // var numberOfResults = locations.length,
        // numberOfRows = numberOfResults % 3 == 0 ? numberOfResults / 3 : numberOfResults / 3 + 1,
        // count = 0;
        var locationToImageMap = {},
            imageIDArray = [];
        for (var i in locations) {
            var imageId = locations[i].images[0],
                locationId = locations[i]._id;
            imageIDArray.push(imageId);
            locationToImageMap[locationId] = imageId;
        }

        // console.log(imageIDArray);

        Image.findImagesByIds(imageIDArray, function (err, images) {
            console.log(arguments);
            // console.log(images.length);
            var locationResults = [],
                imageMap = {};

            //map images to their id
            for (var i in images) {
                var imageId = images[i]._id;
                imageMap[imageId] = images[i];
            }

            for (var i = 0; i < locations.length; i++) {
                var locationToCopy = locations[i].toObject(); //We must convert from mongo document to regular object to be able to extend
                var imageToCopyId = locationToImageMap[locationToCopy._id];
                var base64Img = imageMap[imageToCopyId].img.data.toString('base64');
                //console.log(base64Img);
                var location = extend({}, locationToCopy, {img: base64Img});
                delete location["__v"];
                //console.log(location);
                locationResults.push(location);
            }

            //send back features that were filtered on
            var featuresFiltered = {};
            for (var i in features) {
                var feature = features[i];
                featuresFiltered[feature] = "true";
            }

            res.render('search', {
                title: 'ShareSpace - Search',
                features: featuresFiltered,
                results: locationResults,
                minPrice: minPrice,
                maxPrice: maxPrice,
                distance: req.body.distance,
                user: user //we should not need this line, there is issue where user is not available globally in search page, rest are fine
            });
        });


    });


});

module.exports = router;