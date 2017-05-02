var express = require('express');
var app = express();
var port = process.env.PORT || 8080;

var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({
        secret: 'anystringoftext',
        saveUninitialized: true,
        resave: true
}));

// app.use('/', function(req, res){
//     res.send('Our first Express program');
//     console.log('Cookies: ', req.cookies);
//     console.log('--------------');
//     console.log(req.session);
// });

require("./app/routes.js")(app);

app.listen(port);
console.log('Server running on port: ' + port);