var mongoose = require('mongoose');

//Space Schema
var SpaceSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    loc: {
        type: [Number],// [<longitude>, <latitude>]
        required: true,
        index: '2d'    // create the geospatial index
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    floors: {
        type: Number
    },
    floorSpace: {
        type: Number
    },
    rooms: {
        type: Number
    },
    desks: {
        type: Number
    },
    description: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true,
        index: true
    },
    website: {
        type: String
    },
    perHour: {
        type: Number,
        index: true
        //required: true
    },
    perDay: {
        type: Number,
        index: true
        //required: true
    },
    perMonth: {
        type: Number,
        index: true
        //required: true
    },
    hoursOfOperation: {
        monday: {open: String, close: String},
        tuesday: {open: String, close: String},
        wednesday: {open: String, close: String},
        thursday: {open: String, close: String},
        friday: {open: String, close: String},
        saturday: {open: String, close: String},
        sunday: {open: String, close: String}
    },
    features: {
        type: Array //i.e [{'tooltip': "Wifi", 'class': 'uk-icon-wifi'}, {'tooltip': "Parking available", 'class': 'uk-icon-car'},
                    //{'tooltip': "Wheelchair accessible", 'class': 'uk-icon-wheelchair'}]
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    ratingTotal: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    images: {
        type: Array
    },
    unavailableDates: {
        type: Array,
        default: []
    },
    unavailableHours: {
        type: Object,
        default: {}
    }

});

var Space = module.exports = mongoose.model('Space', SpaceSchema);


//get spaces by username
module.exports.getSpaceByUsername = function (username, callback) {
    Space.findOne({username: username}, callback);
};

module.exports.findNearBy = function (coordinates, distance, limit, callback) {
    Space.find({
        loc: {
            $near: coordinates,
            $maxDistance: distance
        }
    }).limit(limit).exec(callback);
};


//get space by id
module.exports.getSpaceById = function (id, callback) {
    Space.findOne({_id: id}, callback);
};
module.exports.removeSpacesByOwner = function (id, callback) {
    Space.remove({owner: id}, callback);
};

module.exports.getSpacesByOwner = function (id, callback) {
    Space.find({owner: id}, callback);
};

module.exports.createSpace = function (newSpace, callback) {
    newSpace.save(callback);
};
module.exports.updateAvailabilityDates = function (space, newDates, callback) {

    var dates = space.unavailableDates;
    dates = dates.concat(newDates);

    space.update({unavailableDates: dates}, callback);


};
module.exports.updateAvailabilityHours = function (spaceId, newDate, newHours, callback) {

    //get the space
    Space.getSpaceById(spaceId, function (err, space) {
        var hours = space.unavailableHours;

        if (hours[newDate]) { // already has some hours reserved, so update them
            var hoursArray = hours[newDate];

            console.log(hoursArray);

            hoursArray = hoursArray.concat(newHours);

            console.log(hoursArray);
            hours[newDate] = hoursArray;

        }
        else { //create new instance for that date
            hours[newDate] = newHours;
        }

        console.log(hours);
        space.update({unavailableHours: hours}, callback);
    });

};

module.exports.queryBuild = function (queryObject, callback) {
    var query = {};
    if (queryObject.location) {
        query.loc = {
            $near: queryObject.location.coordinates,
            $maxDistance: queryObject.location.distance
        }
    }
    if (queryObject.price && queryObject.priceType) {
        query[queryObject.priceType] = {$gte: queryObject.price.min, $lte: queryObject.price.max};
        // query["$or"] = [
        //     {preferredBid: {$gte: queryObject.price.min, $lte: queryObject.price.max}},
        //     {rentNowPrice: {$gte: queryObject.price.min, $lte: queryObject.price.max}}
        // ];
    }
    if (queryObject.features && queryObject.features.length > 0) {
        query.features = {$all: queryObject.features};
    }
    console.log(query);
    Space.find(query).limit(queryObject.limit).exec(callback);


};

module.exports.updateReviewTotals = function (id, rating, callback) {
    Space.getSpaceById(id, function (err, space) {
        if (err)
            throw err;

        var oldRatingTotal = space.ratingTotal;
        var oldNumberOfReviews = space.numberOfReviews;

        var newRatingTotal = Number(oldRatingTotal) + Number(rating);
        var newNumberOfReviews = Number(oldNumberOfReviews) + Number(1);


        var average = newRatingTotal / newNumberOfReviews;

        space.update({
            $set: {
                averageRating: Math.round(average * 10) / 10,
                ratingTotal: newRatingTotal,
                numberOfReviews: newNumberOfReviews
            }
        }, callback);


    });

};