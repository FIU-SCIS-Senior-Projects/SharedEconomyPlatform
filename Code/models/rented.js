var mongoose = require('mongoose');

//review Schema
var RentedSchema = mongoose.Schema({
    renterUsername: {
        type: String,
        required: true
    },
    spaceId: {
        type: String
    },
    dates: {
        type: Array,
        required: true
    },
    hours: {
        type: Array,
    },
    price: {
        type: Number,
        required: true
    },
    type: { // Hour, Day. or Month
        type: String,
        required: true
    },
    created: {type: Date, default: Date.nowS}
});

var Rented = module.exports = mongoose.model('Rented', RentedSchema);


module.exports.createRented = function (newRented, callback) {
    newRented.save(callback);

};

module.exports.getRentedByOwnerUsername = function (id, callback) {
    Rented.find({ownerId: id}, callback);
};



