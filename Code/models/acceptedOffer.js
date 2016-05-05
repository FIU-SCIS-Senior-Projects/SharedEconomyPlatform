var mongoose = require('mongoose');

var AcceptedOfferSchema = mongoose.Schema({
    offerOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    spaceOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    spaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true,
        index: true
    },
    dates: {
        type: Array,
        required: true
    },
    hours: {
        type: Array,
    },
    offerAmount: {
        type: Number,
        required: true
    },
    stripeToken: {
        type: String,
        required: true,
        index: true
    },
    type: { // Hour, Day, or Month
        type: String,
        required: true
    },
    created: {type: Date, default: Date.now}
});

var AcceptedOffer = module.exports = mongoose.model('AcceptedOffer', AcceptedOfferSchema);


module.exports.createOffer = function (newOffer, callback) {
    newOffer.save(callback);

};

module.exports.getOffersBySpaceOwnerId = function (id, callback) {
    AcceptedOffer.find({spaceOwnerId: id}, callback);
};

module.exports.getOffersBySpaceId = function (id, callback) {
    AcceptedOffer.find({spaceId: id}, callback);
};

module.exports.findAndRemove = function (id, callback) {
    AcceptedOffer.remove({_id: id}, callback);
};

module.exports.findBySpaceOwnerAndPopulate = function (query, callback) {
    AcceptedOffer.find({spaceOwnerId: query.id}).populate('spaceOwnerId offerOwnerId spaceId')
        .skip(query.skip || "")
        .limit(15)
        .exec(callback);
};



