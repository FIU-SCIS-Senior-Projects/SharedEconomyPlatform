var mongoose = require('mongoose');

//review Schema
var ReviewSchema = mongoose.Schema({
    username: {
        index: true,
        type: String,
        required: true
    },
    description: {
        type: String
    },
    rating: {
        type: Number,
        required: true
    },
    spaceId: {
        type: String,
        required: true
    },
    formattedDate: {
        type: String,
        default: ""
    },
    created: {type: Date, default: Date.now}
});

var Review = module.exports = mongoose.model('Review', ReviewSchema);


module.exports.createReview = function (newReview, callback) {
    newReview.save(callback);

};

module.exports.removeSpaceReviews = function (id, callback) {
    Review.remove({spaceId: id}, callback);

};

module.exports.getReviewByUsername = function (username, callback) {
    Review.findOne({username: username}, callback);
};

module.exports.getReviewsById = function (id, callback) {
    Review.find({spaceId: id}, callback);
};
module.exports.setFormattedDate = function (id, string, callback) {

    Review.update({_id: id}, {$set: {formattedDate: string}}, callback);

};


