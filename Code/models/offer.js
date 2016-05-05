var mongoose = require('mongoose');

var OfferSchema = mongoose.Schema({
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
    created: {type: Date, default: Date.now, index: {expires: '72h'}}
});

var Offer = module.exports = mongoose.model('Offer', OfferSchema);


module.exports.createOffer = function (newOffer, callback) {
    newOffer.save(callback);

};

module.exports.getOffersBySpaceOwnerId = function (id, callback) {
    Offer.find({spaceOwnerId: id}, callback);
};

module.exports.getOffersBySpaceId = function (id, callback) {
    Offer.find({spaceId: id}, callback);
};

module.exports.findAndRemove = function (id, callback) {
    Offer.findOneAndRemove({_id: id})
        .populate('spaceOwnerId offerOwnerId spaceId')
        .exec(callback);
};

module.exports.deleteOffer = function (id, callback) {
    Offer.remove({_id: id}, callback)

};

module.exports.findBySpaceOwnerAndPopulate = function (query, callback) {
    Offer.find({spaceOwnerId: query.id}).populate('spaceOwnerId offerOwnerId spaceId')
        .skip(query.skip || "")
        .limit(15)
        .exec(callback);
};



