var express = require('express');
var router = express.Router();
var async = require('async');
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
var Image = require('../models/image');
var Space = require('../models/space');
var User = require('../models/user');

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {

    User.getUserById(req.user._id, function (err, user) {

        if (!user.accountId) { // user has not made an account yet with stripe
            res.redirect('/bankInfo');
        }
        else {
            res.render('newlisting', {title: 'HyperDesk - New Listing'});
        }
    });

});

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return next();
  }
    res.redirect('/');
};

router.post('/new', upload.array("newListingPhotos[]", 8), function (req, res, next) {
    if(!req.user){
        res.status(400).send({error: "User not logged in."});
    }else{
        // console.log(req.body);
        //console.log(req.files);
        var imagesToUpload = req.files;
        var numberOfFiles = imagesToUpload.length;
        var uploadedImages = [];
        async.whilst(
            function () {
                return numberOfFiles > 0;
            },
            function (callback) {
                numberOfFiles--;

                var image = imagesToUpload[numberOfFiles];

                var imageToUpload = new Image({
                    img: {
                        data: image.buffer,
                        contentType: image.mimeType,
                        size: image.size
                    },
                    filename: image.originalname
                });

                Image.createImage(imageToUpload, function (error, savedImage) {
                    if (error) {
                        callback(error);
                    } else {
                        uploadedImages.push(savedImage._id);
                        callback(null, uploadedImages);
                    }
                });
            },
            function (err, images) {
                if (err) {
                    //TODO: handle error
                    res.send(500).send({error: err});
                }
                else {
                    var spaceFeatures = [];
                    var geolocation = [Number(req.body.lng), Number(req.body.lat)];
                    for (var key in req.body) {
                        if (key.substring(0, 7) === "feature") {
                            spaceFeatures.push(key.substring(7, key.length));
                        }
                    }
                    var newSpace = new Space({
                        type: req.body.spaceType,
                        name: req.body.spaceName,
                        loc: geolocation,
                        email: req.body.email,
                        phone: req.body.phoneNumber,
                        floors: req.body.floors,
                        floorSpace: req.body.spaceArea,
                        rooms: req.body.roomCount,
                        desks: req.body.numberDesks,
                        description: req.body.spaceDescription,
                        owner: req.user._id,
                        website: req.body.website,
                        perHour: Number(req.body.perHour),
                        perDay: Number(req.body.perDay),
                        perMonth: Number(req.body.perMonth),
                        hoursOfOperation: {
                            monday: {open: req.body.mondayOpen, close: req.body.mondayClose},
                            tuesday: {open: req.body.tuesdayOpen, close: req.body.tuesdayClose},
                            wednesday: {open: req.body.wednesdayOpen, close: req.body.wednesdayClose},
                            thursday: {open: req.body.thursdayOpen, close: req.body.thursdayClose},
                            friday: {open: req.body.fridayOpen, close: req.body.fridayClose},
                            saturday: {open: req.body.saturdayOpen, close: req.body.saturdayClose},
                            sunday: {open: req.body.sundayOpen, close: req.body.sundayClose}
                        },
                        features: spaceFeatures,
                        images: images
                    });

                    Space.createSpace(newSpace, function (error, createdSpace) {
                        if(error){
                            res.status(500).send({error: "Unable to create new Space listing"});
                            console.log(error);
                        }
                        else{
                            res.status(200).send({createdSpace: createdSpace});
                            console.log("New Space created:");
                            console.log(createdSpace);
                        }
                    });
                }
            }
        );
        //console.log(req);
    }
});


module.exports = router;
