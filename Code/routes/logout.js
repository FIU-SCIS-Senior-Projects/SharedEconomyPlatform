var express = require('express');
var router = express.Router();

//User logs out
router.get('/', function(req, res, next) {
    req.logout();
    res.redirect('/login');
});

module.exports = router;
