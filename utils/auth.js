const Campground = require('../models/campground');

/*
  isLoggedIn:
  - If the user is authenticated, proceed.
  - Otherwise store the attempted URL and redirect to /login with a flash message.
*/
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated && req.isAuthenticated()) {
		return next();
	}
	req.session.returnTo = req.originalUrl;
	req.flash('error', 'You must be signed in to access that page.');
	return res.redirect('/login');
}

/*
  isAuthor:
  - Ensures the logged-in user is the author of the campground being changed.
  - Uses async/await to fetch the campground and compare owner ids.
*/
async function isAuthor(req, res, next) {
	try {
		const { id } = req.params;
		const campground = await Campground.findById(id);
		if (!campground) {
			req.flash('error', 'Campground not found.');
			return res.redirect('/campgrounds');
		}
		if (!req.user || campground.author.toString() !== req.user._id.toString()) {
			req.flash('error', 'You do not have permission to do that.');
			return res.redirect(`/campgrounds/${id}`);
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

module.exports = { isLoggedIn, isAuthor };
