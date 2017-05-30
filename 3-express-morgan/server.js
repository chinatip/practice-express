var express = require('express');
var app = express();
var port = process.env.PORT || 8080;

var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(session);

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);
require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
        secret: 'anystringoftext',
        saveUninitialized: true,
        resave: true,
        store: new MongoStore({
                mongooseConnection: mongoose.connection,
                ttl: 2 * 24 * 60 * 60 })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function(req, res, next){
	console.log(req.session);
	console.log("===================");
	console.log(req.user);
	next();
});

app.set('view engine', 'ejs');
var auth = express.Router();
require('./app/routes/auth.js')(auth, passport);
app.use('./auth', auth);

var secure = express.Router();
require('./app/routes/secure.js')(secure, passport);
app.use('/', secure);

// app.use('/', function(req, res){
//     res.send('Our first Express program');
//     console.log('Cookies: ', req.cookies);
//     console.log('--------------');
//     console.log(req.session);
// });

require("./app/routes.js")(app, passport);

app.listen(port);
console.log('Server running on port: ' + port);