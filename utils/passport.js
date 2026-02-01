const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

/*
  Set up Passport to use the local strategy with email as the username field.
  passport-local-mongoose exposes authenticate(), serializeUser() and deserializeUser().
*/
function setupPassport() {
	passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));
	passport.serializeUser(User.serializeUser());
	passport.deserializeUser(User.deserializeUser());
}

module.exports = setupPassport;
