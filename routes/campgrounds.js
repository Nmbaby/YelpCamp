const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const geocode = require('../utils/nominatim-geocode');

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))


router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))

// New: JSON endpoint for frontend to fetch campgrounds with geometry + popup text
router.get('/campgrounds.json', async (req, res, next) => {
	try {
		const campgrounds = await Campground.find({});
		// Map to a small payload the frontend expects
		const payload = campgrounds.map(cg => ({
			_id: cg._id,
			title: cg.title,
			location: cg.location,
			geometry: cg.geometry || null,
			// popupText contains HTML shown in markers' popups
			popupText: `<strong>${escapeHtml(cg.title)}</strong><br>${escapeHtml(cg.location)}`
		}));
		res.json(payload);
	} catch (err) {
		next(err);
	}
});

// small helper to avoid injecting raw text into popup HTML
function escapeHtml(s = '') {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

/* Create campground (must be logged in) */
router.post('/', isLoggedIn, async (req, res, next) => {
	try {
		const campData = req.body.campground;
		const campground = new Campground(campData);
		// Record the currently logged-in user as the author
		campground.author = req.user._id;
		await campground.save();
		req.flash('success', 'Successfully created a new campground!');
		res.redirect(`/campgrounds/${campground._id}`);
	} catch (err) {
		next(err);
	}
});

/* Edit form: only the author may access */
router.get('/:id/edit', isLoggedIn, isAuthor, async (req, res, next) => {
	try {
		const campground = await Campground.findById(req.params.id);
		if (!campground) {
			req.flash('error', 'Campground not found.');
			return res.redirect('/campgrounds');
		}
		res.render('campgrounds/edit', { campground });
	} catch (err) {
		next(err);
	}
});

/* Update campground: only author */
router.put('/:id', isLoggedIn, isAuthor, async (req, res, next) => {
	try {
		const { id } = req.params;
		const updated = await Campground.findByIdAndUpdate(id, req.body.campground, { new: true, runValidators: true });
		req.flash('success', 'Successfully updated campground!');
		res.redirect(`/campgrounds/${updated._id}`);
	} catch (err) {
		next(err);
	}
});

/* Delete campground: only author */
router.delete('/:id', isLoggedIn, isAuthor, async (req, res, next) => {
	try {
		await Campground.findByIdAndDelete(req.params.id);
		req.flash('success', 'Campground deleted.');
		res.redirect('/campgrounds');
	} catch (err) {
		next(err);
	}
});

// Create campground (example handler)
router.post('/', isLoggedIn, async (req, res, next) => {
	try {
		const campData = req.body.campground;
		const campground = new Campground(campData);
		// Set the author to the currently logged-in user
		campground.author = req.user._id;
		await campground.save();
		req.flash('success', 'Successfully created a new campground!');
		res.redirect(`/campgrounds/${campground._id}`);
	} catch (err) {
		next(err);
	}
});

// Update campground (example handler)
router.put('/:id', isLoggedIn, isAuthor, async (req, res, next) => {
	try {
		const { id } = req.params;
		const updated = await Campground.findByIdAndUpdate(id, req.body.campground, { new: true, runValidators: true });
		req.flash('success', 'Successfully updated campground!');
		res.redirect(`/campgrounds/${updated._id}`);
	} catch (err) {
		next(err);
	}
});

module.exports = router;