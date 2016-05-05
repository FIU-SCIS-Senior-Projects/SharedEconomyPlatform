var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var hbs = require('hbs');
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var multer = require('multer');
var database = require('./models/database');


//Routes
var routes = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var register = require('./routes/register');
var logout = require('./routes/logout');
var verify = require('./routes/verify');
var resetpassword = require('./routes/resetpassword');
var changepassword = require('./routes/changepassword');
var viewSpace = require('./routes/viewspace');
var addSpace = require('./routes/newlisting');
var search = require('./routes/search');
var review = require('./routes/review');
var offer = require('./routes/offer');
var rentNow = require('./routes/rentnow');
var profile = require('./routes/profile');
var bankInfo = require('./routes/bankInfo');
var mailbox = require('./routes/mailbox');

var app = express();

// view engine setup
hbs.localsAsTemplateData(app);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');


/**
 * Helpers
 */
var helpers = require('./helpers/helpers');
helpers.initializeHelpers();


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//Handle file uploads
var upload = multer({ dest: 'uploads/' })

//Handle Express Sessions
app.use(session({
  secret:'sharedeconomyplatform',
  saveUninitialized: true,
  resave: true
}));

//Passport
app.use(passport.initialize());
app.use(passport.session());

//Validator
var User = require('./models/user');
var TempUser = require('./models/tempuser');
// In this example, the formParam value is going to get morphed into form body format useful for printing.
app.use(expressValidator({
  customValidators: {
    isUsernameAvailable: function(username) {
      if(username == "" || !username)
        return true; //empty username is handled by isEmpty validator so we let it pass this test to not override that error
      return new Promise(function(resolve, reject){
        User.getUserByUsername(username, function(err, user){
          if(err) throw err;
          if(!user){
            //check tempuser table
            TempUser.getTempUserByUsername(username, function(error, tempUser){
              if(error) throw error;
              if(!tempUser){
                resolve();
              }else{
                //user exists in tempuser collection
                reject("Account with username already exists but is not verified.");
              }
            });
          }else{
            //user exists in users collection
            reject("Account with username already exists and is verified.");
          }
        });
      });
    },
    canEmailRegister: function(email){
      if(email == "" || !email)
        return true; //empty email is handled by isEmpty validator so we let it pass this test to not override that error
      return new Promise(function(resolve, reject){
        User.getUserByEmail(email, function(err, user){
          if(!user){
            //check tempuser table
            TempUser.getTempUserByEmail(email, function(err, tempUser){
              if(!tempUser){
                resolve();
              }else{
                //user exists in tempuser collection
                reject("Account with this e-mail already exists but is not verified.");
              }
            });
          }else{
            //user exists in users collection
            reject("Account with this e-mail already exists and is verified.");
          }
        });
      });
    },
    isEmailRegistered: function (email){
      if (email == "" || !email)
        return true; //empty email is handled by isEmpty validator so we let it pass this test to not override that error
      return new Promise(function (resolve, reject) {
        User.getUserByEmail(email, function (err, user){
          if (user) {
            resolve(); //user exists
          }else{
            //user doesn't exist
            reject("Account with this e-mail doesnt exist.");
          }
        });
      });
    },
    hasNoWhiteSpace: function(string){
      return !(/\s/g.test(string));
    },
    isexpDateFormattedCorrectly: function (e) {
      console.log(isNaN(e.charAt(0)));

      if (e.charAt(2) == '/' && !isNaN(e.charAt(0)) && !isNaN(e.charAt(1)) && !isNaN(e.charAt(3)) && !isNaN(e.charAt(4)) && e.length == 5) {
        return true;
      }
      return false;
    },
    hasLetter: function(string){
      // check for characters between a and z
      // i flag makes it case insensitive
      return /[a-z]/i.test(string);
    }
  },
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


//Make user available to all views, in handlebars view object will be 'user'
app.get('*', function(req, res, next){
  //if(req.session.user != undefined){
  //  res.locals.user = {
  //    username: req.session.user.username,
  //    email: req.session.user.email
  //  }
  //}
  res.locals.user = req.user || null;
  next();
});

app.use('profile owner', function (req, action) {
  return req.isAuthenticated() &&
      req.user.username === req.params.username;
})


//Flash
app.use(flash());
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res);
  next();
});



//Use routes
app.use('/', routes);
app.use('/login', login);
app.use('/logout', logout);
app.use('/register', register);
app.use('/verify', verify);
app.use('/users', users);
app.use('/resetpassword', resetpassword);
app.use('/changepassword', changepassword);
app.use('/viewspace', viewSpace);
app.use('/newlisting', addSpace);
app.use('/review', review);
app.use('/offer', offer);
app.use('/rentnow', rentNow);
app.use('/search', search);
app.use('/profile', profile);
app.use('/bankInfo', bankInfo);
app.use('/mailbox', mailbox);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
