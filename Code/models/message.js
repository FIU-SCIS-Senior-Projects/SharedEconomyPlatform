/**
 * Created by Daniel on 4/18/2016.
 */
var mongoose = require('mongoose');

var MessageSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    messageSubject: {
        type: String,
        required: true
    },
    messageContent: {
        type: String,
        required: true
    },
    sentDate: {type: Date, default: Date.now}
});

var Message = module.exports = mongoose.model('Message', MessageSchema);


module.exports.createMessage = function (newMessage, callback) {
    newMessage.save(callback);
};

module.exports.getMessagesBySenderId = function (id, callback) {
    Message.find({senderId: id}).populate('receiverId').exec(callback);
};

module.exports.getMessagesByReceiverId = function (id, callback) {
    Message.find({receiverId: id}).populate('senderId').exec(callback);
};

module.exports.markAsRead = function (messageId, callback) {
    Message.update({_id: messageId}, {$set: {readStatus: true}}, callback);
};

module.exports.markAsUnread = function (messageId, callback) {
    Message.update({_id: messageId}, {$set: {readStatus: false}}, callback);
};

module.exports.findAndRemove = function (id, callback) {
    Message.findOneAndRemove({_id: id})
        .populate('senderId receiverId')
        .exec(callback);
};

module.exports.geMessageById = function (id, callback) {
    Message.findById(id, callback);
};

module.exports.findByIdAndPopulate = function (id, callback) {
    Message.findOne({_id: id}).populate('senderId receiverId').exec(callback);
};



