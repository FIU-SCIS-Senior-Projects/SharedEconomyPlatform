var express = require('express');
var router = express.Router();
var Space = require('../models/space');
var Review = require('../models/review');
var moment = require('moment');

router.get('/', function (req, res, next) {
    res.location('/');
    res.redirect('/');

});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    req.session.returnTo = "/review" + req.path;
    console.log(req.session.returnTo);
    res.redirect('/login');
};

router.get('/:id', ensureAuthenticated, function (req, res, next) {

    var id = req.params.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) { // check if valid id object
        res.redirect('/'); //redirect to home page

    }
    else {

        Space.getSpaceById(id, function (err, space) {
            if (err)
                throw err;
            else if (!space) { //space doesn't exist in db
                res.redirect('/'); //redirect to home page
                console.log("redirect2");
            }
            //add code to verify that the user has rented this space before
            else { //display review template
                res.render('review', {
                    title: 'HyperDesk - Review',
                    spaceName: space.name,
                    id: id,
                    errors: req.flash('starError')
                });
            }
        });
    }

});

router.post('/', function (req, res, next) {

    //Form validation
    //check that a star was chosen
    req.checkBody('star', 'Please select rating.').notEmpty();

    var errors = req.validationErrors();

    if (errors) { //redirect and show error message
        console.log("errors exist");
        req.flash('starError', 'Please select a rating');
        res.redirect('/review/' + req.body.reviewId);

    }
    else {
        //create the review
        var rating = parseInt(req.body.star);

        var newReview = new Review({
            rating: rating,
            username: req.user.username,
            description: req.body.reviewInput,
            spaceId: req.body.reviewId,
        });


        Review.createReview(newReview, function (error, review) {
            if (error)
                throw error;
            //set formatted date
            Review.setFormattedDate(review._id, moment(review.created).format('MM/DD/YYYY'), function (error, review) {
                if (error)
                    throw error;

                console.log(review);
            });

        });

        //update the review total, rating total, and average
        Space.updateReviewTotals(req.body.reviewId, req.body.star, function (error) {
            if (error)
                throw error;

            //for checking purposes
            Space.getSpaceById(req.body.reviewId, function (error, space) {
                console.log(space);

                res.redirect("/viewspace/" + req.body.reviewId);
            });
        });
    }



});


module.exports = router;
