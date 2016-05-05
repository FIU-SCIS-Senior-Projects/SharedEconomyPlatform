var mongoose = require( 'mongoose' );
var config = require('../config/config');
// var elasticsearch = require('elasticsearch');
// var elasticClient = new elasticsearch.Client({
//     host: 'localhost:9200',
//     log: 'trace'
// });
//
// elasticClient.ping({
//     // ping usually has a 3000ms timeout
//     requestTimeout: Infinity,
//
//     // undocumented params are appended to the query string
//     hello: "elasticsearch!"
// }, function (error) {
//     if (error) {
//         console.trace('elasticsearch cluster is down!');
//     } else {
//         console.log('All is well');
//     }
// });

// Build the connection string
var dbURI = config.dbProperties.uri;

// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination.');
        process.exit(0);
    });
});