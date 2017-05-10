var localStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var axios = require('axios');

var User = require('../app/models/user');
var configAuth = require('./auth');

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });

    passport.use('local-signup', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done) {
        process.nextTick(function(){
            User.findOne({'local.username': email}, function(err, user) {
                if(err)
                    return done(err);
                if(user) {
                    return done(null, false, req.flash('signupMessage', 'That email already taken'));
                } else {
                    var newUser = new User();
                    newUser.local.username = email;
                    newUser.local.password = newUser.generateHash(password);
                    
                    newUser.save(function(err) {
                        if(err)
                            throw err;
                        return done(null, newUser);
                    });
                }
                
            });
        });
    }));

    passport.use('local-login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done) {
        process.nextTick(function(){
            User.findOne({'local.username': email}, function(err, user) {
                if(err)
                    return done(err);
                if(!user) 
                    return done(null, false, req.flash('loginMessage', 'No user found'));
                if(!user.validPassword(password)) 
                    return done(null, false, req.flash('loginMessage', 'Invalid password'));
                return done(null, user);
            });
        });
    }));

    passport.use(new FacebookStrategy({
	    clientID: configAuth.facebookAuth.clientID,
	    clientSecret: configAuth.facebookAuth.clientSecret,
	    callbackURL: configAuth.facebookAuth.callbackURL
        // ,
        // passReqToCallback : true,
        // profileFields: ['id', 'emails', 'name']
	  },
	  function(accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
	    		User.findOne({'facebook.id': profile.id}, function(err, user) {
	    			if(err)
	    				return done(err);
	    			if(user)
	    				return done(null, user);
	    			else {
	    				var newUser = new User();
	    				newUser.facebook.id = profile.id;
	    				newUser.facebook.token = accessToken;

	    				

	    				
	    				
                        axios.get('https://graph.facebook.com/me?fields=email,name&access_token=' + accessToken)
                            .then(function (response) {
                                newUser.facebook.email = response.data.email;
                                newUser.facebook.name = response.data.name;
                                console.log(response.data)
                                newUser.save(function(err){
                                    if(err)
                                        throw err;
                                    return done(null, newUser);
                                });
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
	    			    }
	    		});
	    	});
	    }

	));
}