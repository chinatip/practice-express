var localStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
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
                } 
                if(!req.user) {
                    var newUser = new User();
                    newUser.local.username = email;
                    newUser.local.password = newUser.generateHash(password);
                    
                    newUser.save(function(err) {
                        if(err)
                            throw err;
                        return done(null, newUser);
                    });
                }
                else {
                    var user = req.user;
					user.local.username = email;
					user.local.password = user.generateHash(password);

					user.save(function(err){
						if(err)
							throw err;
						return done(null, user);
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
	    callbackURL: configAuth.facebookAuth.callbackURL,
        passReqToCallback : true
	  },
	  function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){

                //user is not logged it yet
                if(!req.user) {
	    		    User.findOne({'facebook.id': profile.id}, function(err, user) {
                        if(err)
                            return done(err);
                        if(user){
                            if(!user.facebook.token) {
                                user.facebook.token = accessToken;
                                axios.get('https://graph.facebook.com/me?fields=email,name&access_token=' + accessToken)
                                    .then(function (response) {
                                        user.facebook.email = response.data.email;
                                        user.facebook.name = response.data.name;
                                        console.log(response.data)
                                        user.save(function(err){
                                            if(err)
                                                throw err;
                                            return done(null, user);
                                        });
                                    })
                                    .catch(function (error) {
                                        console.log(error);new User()
                                    });
                            }
                            return done(null, user);
                        }
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
                }
                //user is logged in already, and needs to be merged

                else {
                    var user = req.user;
	    			user.facebook.id = profile.id;
	    			user.facebook.token = accessToken;
	    			axios.get('https://graph.facebook.com/me?fields=email,name&access_token=' + accessToken)
                        .then(function (response) {
                            user.facebook.email = response.data.email;
                            user.facebook.name = response.data.name;
                            console.log(response.data)
                            user.save(function(err){
                                if(err)
                                    throw err;
                                return done(null, user);
                            });
                        })
                        .catch(function (error) {
                            console.log(error);new User()
                        });
                }
	    	});
	    }

	));

    passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL,
	    passReqToCallback: true
	  },
	  function(req, accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
                //user is not logged it yet
                if(!req.user) {
                    User.findOne({'google.id': profile.id}, function(err, user){
                        if(err)
                            return done(err);
                        if(user) {
                            if(!user.google.token) {
                                user.google.token = accessToken;
                                user.google.name = profile.displayName;
                                user.google.email = profile.emails[0].value;

                                user.save(function(err){
                                    if(err)
                                        throw err;
                                    return done(null, user);
                                });
                            }
                            return done(null, user);
                        }
                        else {
                            var newUser = new User();
                            newUser.google.id = profile.id;
                            newUser.google.token = accessToken;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = profile.emails[0].value;

                            newUser.save(function(err){
                                if(err)
                                    throw err;
                                return done(null, newUser);
                            });
                            console.log(profile);profile
                        }
                    });  
                }
                //user is logged in already, and needs to be merged
                else {
                    var user = req.user;
                            user.google.id = profile.id;
                            user.google.token = accessToken;
                            user.google.name = profile.displayName;
                            user.google.email = profile.emails[0].value;

                            user.save(function(err){
                                if(err)
                                    throw err;
                                return done(null, user);
                            });
                }
	    	});
	    }

	));

    passport.use(new BearerStrategy({},
        function(token, done){
            User.findOne({ _id: token }, function(err, user){
                if(!user)
                    return done(null, false);
                return done(null, user);
            });
        }));

}