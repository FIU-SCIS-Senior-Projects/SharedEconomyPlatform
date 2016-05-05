/**
 * Helpers
 */

var hbs = require('hbs');
var helpers = {

    /**
     * If word1 matches word2, returns result as a handlebars safe string
     */
    'ifMatch': function(word1, array, result){
        var wordArray = eval(array);
        var wordsMatch = false;
        for(var index in wordArray){
            if(word1 == wordArray[index]){
                wordsMatch = true;
                break;
            }
        }
        return wordsMatch ? new hbs.handlebars.SafeString(result) : '';
    },
    'unlessMatch': function(word1, array, result){
        var wordArray = eval(array);
        var wordsMatch = false;
        for(var index in wordArray)
            if(word1 == wordArray[index]){
                wordsMatch = true;
                break;
            }
        return wordsMatch ? '' : new hbs.handlebars.SafeString(result);
    },
    'times': function (n, block) {
        var acum = '';
        for (var i = 0; i < n; i++) {
            acum += block.fn(i);
        }
        return acum;
    },
    'timesAndSubtract': function (n, block) {
        n = 5 - Number(n);
        var acum = '';
        for (var i = 0; i < n; i++) {
            acum += block.fn(i);
        }
        return acum;
    }
};

module.exports = {
    initializeHelpers : function(){
        for(var helper in helpers){
            hbs.registerHelper(helper, helpers[helper]);
        }
    }
};

/*
 Below is a different way of registering helpers with self executing function.
 If used, simply require this module in app.js, no need to initialize
 */
//module.exports = (function() {
//
//    for(var helper in helpers){
//        hbs.registerHelper(helper, helpers[helper]);
//    }
//
//}()); //execute

