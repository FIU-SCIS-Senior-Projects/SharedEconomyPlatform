var mongoose = require('mongoose');

//User Schema
var ImageSchema = mongoose.Schema({
    img: {
        data: Buffer,
        contentType: String,
        size: Number
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    filename: {
        type: String
    }
});

var Image = module.exports = mongoose.model('Image', ImageSchema);

module.exports.createImage = function (newImage, callback) {
    newImage.save(callback);
};
module.exports.findImageById = function (id, callback) {
    Image.findOne({_id: id}, callback);
};

module.exports.findImagesByIds = function (idArray, callback) {
    Image.find({
        _id: {$in: idArray}
    }, callback);
};

module.exports.deleteImagesByIds = function (idArray, callback) {
    Image.remove({
        _id: {$in: idArray}
    }, callback);
};