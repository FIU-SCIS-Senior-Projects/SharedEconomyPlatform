var express = require('express');
var router = express.Router();
var stripe = require('stripe')('sk_test_Nr4zTr6IMuiKXn2Q4fkDoxRe');
var User = require('../models/user');

router.get('/', function (req, res, next) {

    if (!req.user) {
        res.redirect('/');
    }
    else {

        User.getUserById(req.user._id, function (err, user) {
            if (user.accountId) {
                res.redirect('/');
            }
            else {
                res.render('bankInfo', {
                    title: 'HyperDesk - Bank Account',
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
                });
            }
        });
    }

});

router.post('/', function (req, res, next) {

    stripe.accounts.create({
        managed: true,
        country: 'US',
        email: req.user.email,
        external_account: req.body.bankToken,
        legal_entity: {
            type: "individual",
            ssn_last_4: req.body.ssn,
            first_name: req.user.firstName,
            last_name: req.user.lastName,
            address: {
                city: req.body.city,
                line1: req.body.address,
                postal_code: req.body.zipCode,
                state: req.body.state
            },
            dob: {
                month: req.body.dob.substring(0, 2),
                day: req.body.dob.substring(3, 5),
                year: req.body.dob.substring(6, 10)
            },
        },
        tos_acceptance: {
            date: req.body.timestamp,
            ip: req.body.ip
        }

    }, function (err, account) {
        if (err)
            throw err;

        User.setManagedAccountToken(req.user._id, account.id, function (err, user) {

        });

        res.status(200).send({
            code: 200, message: "Bank account and managed account created!"
        });
    });

});
module.exports = router;
