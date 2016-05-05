var express = require('express');
var router = express.Router();
var moment = require('moment');
var Message = require('../models/message');
var User = require('../models/user');


router.post('/mymessages', function (req, res, next) {
    var userId = req.body.userId;

    Message.getMessagesByReceiverId(userId, function (err, receivedMessages) {
        Message.getMessagesBySenderId(userId, function (err, sentMessages) {
            var received = [], sent = [];

            for (var i = 0; i < receivedMessages.length; i++) {
                var receivedMessage = {
                    messageId: receivedMessages[i]._id,
                    sentDate: moment(receivedMessages[i].sentDate).format('MMMM Do YYYY, h:mm:ss a'),
                    subject: receivedMessages[i].messageSubject,
                    message: receivedMessages[i].messageContent,
                    readStatus: receivedMessages[i].readStatus,
                    sender: {
                        username: receivedMessages[i].senderId.username,
                        name: receivedMessages[i].senderId.fullName,
                    }
                };
                received.push(receivedMessage);
            }

            for (var i = 0; i < sentMessages.length; i++) {
                var sentMessage = {
                    messageId: sentMessages[i]._id,
                    sentDate: moment(sentMessages[i].sentDate).format('MMMM Do YYYY, h:mm:ss a'),
                    subject: sentMessages[i].messageSubject,
                    message: sentMessages[i].messageContent,
                    readStatus: sentMessages[i].readStatus,
                    recipient: {
                        username: sentMessages[i].receiverId.username,
                        name: sentMessages[i].receiverId.fullName,
                    }
                };
                sent.push(sentMessage);
            }

            res.status(200).send({receivedMessages: received, sentMessages: sent});

        });
    });

});

router.post('/send', function (req, res, next) {
    var username = req.body.username;
    User.getUserByUsername(username, function (err, user) {
        if (err) next(err);
        if (!user) res.status(404).send(new Error("User not found"));
        else {
            var userId = user._id;
            var newMessage = new Message({
                senderId: req.user._id,
                receiverId: userId,
                messageSubject: req.body.subject,
                messageContent: req.body.message
            });
            Message.createMessage(newMessage, function (error, createdMessage) {
                console.log(arguments);
                if (error) throw error;
                res.status(200).send({createdMessage: createdMessage});
            });
        }

    });
});

router.post('/delete', function (req, res, next) {
    var messageId = req.body.messageId;
    Message.findAndRemove(messageId, function (err, message) {
        if (err) next(err);
        else {
            res.status(200).send({message: message});
        }

    });
});

module.exports = router;