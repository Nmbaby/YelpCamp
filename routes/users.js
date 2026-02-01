const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

/*
  Helper to promisify req.login so we can await it after registering a user.
*/
function loginAsync(req, user) {
	return new Promise((resolve, reject) => {
		req.login(user, (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

/* Registration form */
router.get('/register', (req, res) => {
	res.render('users/register');
});

/* Handle registration - User.register hashes the password automatically */
router.post('/register', async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user = new User({ email });
		const registeredUser = await User.register(user, password); // hash & save
		await loginAsync(req, registeredUser); // login after register
		req.flash('success', 'Welcome! You are now registered.');
		res.redirect('/campgrounds');
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/register');
	}
});

/* Login form */
router.get('/login', (req, res) => {
	res.render('users/login');
});

/*
  Login handling: use passport.authenticate('local') as middleware.
  On success, redirect to saved returnTo URL or /campgrounds.
  On failure, redirect back to /login with a flash (handled by passport).
*/
router.post('/login',
	passport.authenticate('local', {
		failureFlash: true,
		failureRedirect: '/login'
	}),
	(req, res) => {
		req.flash('success', 'Welcome back!');
		const redirectUrl = req.session.returnTo || '/campgrounds';
		delete req.session.returnTo;
		res.redirect(redirectUrl);
	}
);

/* Logout: uses the callback form to avoid "next is not a function" issues */
router.get('/logout', (req, res, next) => {
	req.logout(function (err) {
		if (err) return next(err);
		// Destroy the session to be safe and clear the cookie
		req.session.destroy(function (err) {
			if (err) return next(err);
			res.clearCookie('session'); // ensure this matches the session cookie 'name' in app.js
			req.flash('success', 'You have been logged out.');
			res.redirect('/campgrounds');
		});
	});
});

module.exports = router;