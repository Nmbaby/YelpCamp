// Apply Node deprecation compatibility shims first (avoid util.isArray warnings from old deps)
require('./utils/deprecation-shims');
// Apply mongoose callback-compat shim early so packages (e.g., passport-local-mongoose) that use callback-style exec keep working
require('./utils/mongoose-compat');


if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const helmet = require('helmet');


const mongoSanitize = require("express-mongo-sanitize");


// Replace simple dbUrl assignment with a helper that validates and builds a safe URL.
// This prevents the "invalid URL" deprecation warning and gives clear instructions
// when an Atlas-style "mongodb://host1:27017,host2:27017,..." string is used.
// Prefer mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
function getDbUrl() {
	// If running in development, default to local DB unless explicitly told not to.
	// This allows you to run the app locally without touching Atlas or DB_URL env vars.
	const isDev = process.env.NODE_ENV !== 'production';
	if (isDev && process.env.USE_LOCAL_DB !== 'false') {
		console.info('Development mode detected: defaulting to local MongoDB. To use remote DB_URL set USE_LOCAL_DB=false or set NODE_ENV=production.');
		return 'mongodb://127.0.0.1:27017/yelp-camp';
	}

	// If a full DB URL is provided, validate it
	if (process.env.DB_URL) {
		const raw = process.env.DB_URL.trim();
		// Detect legacy multi-host "mongodb://" Atlas URLs which produce a deprecation warning
		// and commonly trigger TLS/internal errors when used as-is.
		if (raw.startsWith('mongodb://') && raw.includes('mongodb.net') && raw.includes(',')) {
			if (process.env.USE_LOCAL_DB === 'true') {
				// If user explicitly asked for local, fall back quietly instead of exiting.
				console.warn('Detected legacy Atlas "mongodb://" connection string but USE_LOCAL_DB=true — falling back to local MongoDB for development.');
				return 'mongodb://127.0.0.1:27017/yelp-camp';
			}
			console.error('\nDetected legacy Atlas "mongodb://" connection string with multiple hosts.');
			console.error('For MongoDB Atlas, use the "mongodb+srv" connection string instead. Example:');
			console.error('  mongodb+srv://<user>:<password>@ac-zkyxnoy.9m7nzgb.mongodb.net/yelp-camp?retryWrites=true&w=majority\n');
			console.error('Replace your DB_URL with the mongodb+srv form (copy it from Atlas -> Connect), or set USE_LOCAL_DB=true to run locally.');
			// Exit so you can fix your environment variable rather than continue with a broken connection.
			process.exit(1);
		}
		return raw;
	}

	// Alternatively, if separate env vars are provided (safer for including special chars),
	// build a mongodb+srv URL automatically.
	if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_HOST) {
		const user = encodeURIComponent(process.env.DB_USER);
		const pass = encodeURIComponent(process.env.DB_PASS);
		const host = process.env.DB_HOST; // e.g., ac-zkyxnoy.9m7nzgb.mongodb.net
		const dbName = process.env.DB_NAME || 'yelp-camp';
		return `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
	}

	// Fallback to localhost for development (covers cases where NODE_ENV=production but no DB provided)
	return 'mongodb://127.0.0.1:27017/yelp-camp';
}

// Compute DB URL (synchronously) so session store / other middlewares can use it.
const dbUrl = getDbUrl();

// Attempt to connect with helpful diagnostics on failure.
// Optional: adjust strictQuery behavior to suppress unneeded warnings.
mongoose.set('strictQuery', false);

(async function connectWithDiagnostics() {
	try {
		await mongoose.connect(dbUrl, {
			// Default options are fine for Mongoose 7+, but include family to avoid IPv6/IPv4 surprises.
			family: 4,
			// maxPoolSize: 10, // optional tuning
		});
		console.log('Database connected');
	} catch (err) {
		console.error('Error connecting to MongoDB:', err.message);
		// If SSL/TLS-related error, give specific troubleshooting tips
		const msg = (err && err.message) ? err.message.toLowerCase() : '';
		if (msg.includes('ssl') || msg.includes('tls') || msg.includes('certificate') || msg.includes('tlsv1')) {
			console.error('\nTLS/SSL error detected when connecting to MongoDB Atlas. Common causes and fixes:');
			console.error('- Use the mongodb+srv connection string provided by Atlas (not the legacy mongodb:// with multiple hosts).');
			console.error('- Ensure your IP address is allowed in Atlas Network Access (or add 0.0.0.0/0 for testing).');
			console.error('- Make sure your password does not contain unencoded special characters; if not using DB_URL, set DB_USER and DB_PASS and let this app encode them.');
			console.error('- Check for corporate firewall / proxy blocking outbound connections to Atlas.');
			console.error('- Try connecting with MongoDB Compass using the same credentials/URI to narrow down the issue.\n');
		} else if (msg.includes('auth') || msg.includes('authentication')) {
			console.error('\nAuthentication failed: verify the username/password and authSource if applicable.');
		}
		// exit to avoid running the app in a broken state
		process.exit(1);
	}
})();

// Session secret for express-session; in production set SESSION_SECRET to a strong value
const sessionSecret = process.env.SESSION_SECRET || 'thisshouldbeabettersecret';

// ===== Session store helper: works with connect-mongo v4+ and older versions =====
function createMongoStore(mongoUrl) {
	try {
		const connectMongo = require('connect-mongo');

		// Modern API: connect-mongo v4+ exposes .create()
		if (connectMongo && typeof connectMongo.create === 'function') {
			return connectMongo.create({ mongoUrl, touchAfter: 24 * 3600 });
		}

		// Older API: module exports a function that accepts the session module
		if (typeof connectMongo === 'function') {
			const LegacyStore = connectMongo(session);
			return new LegacyStore({ url: mongoUrl, touchAfter: 24 * 3600 });
		}
	} catch (err) {
		console.error('connect-mongo setup error:', err);
	}
	// Returning null will cause express-session to use the default MemoryStore (not for production)
	return null;
}

const store = createMongoStore(dbUrl);

app.use(session({
	store: store || undefined,
	name: 'session', // cookie name - cleared on logout in users.js
	secret: sessionSecret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		// secure: true, // enable in production when using HTTPS
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
}));

// ===== Passport initialization (must come after session middleware) =====
const setupPassport = require('./utils/passport');
setupPassport();
app.use(passport.initialize());
app.use(passport.session());

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith:'_' 
}));

app.use(flash());
app.use(helmet({ contentSecurityPolicy: false }));


// Use Helmet and configure Content Security Policy so Leaflet and OSM resources are allowed.
// This adds the CDNs and tile/geocoding servers needed by Leaflet + OpenStreetMap:
// - unpkg.com (Leaflet CSS/JS)
// - cdn.jsdelivr.net (fallback libraries/maps)
// - tile.openstreetmap.org / a.tile.openstreetmap.org (OSM tiles)
// - nominatim.openstreetmap.org (geocoding)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
	directives: {
		"default-src": ["'self'"],
		"script-src": [
			"'self'",
			"'unsafe-inline'",
			"https://stackpath.bootstrapcdn.com",
			"https://api.tiles.mapbox.com",
			"https://api.mapbox.com",
			"https://kit.fontawesome.com",
			"https://cdnjs.cloudflare.com",
			"https://cdn.jsdelivr.net",
			"https://unpkg.com"
		],
		"style-src": [
			"'self'",
			"'unsafe-inline'",
			"https://kit-free.fontawesome.com",
			"https://stackpath.bootstrapcdn.com",
			"https://fonts.googleapis.com",
			"https://use.fontawesome.com",
			"https://unpkg.com",
			"https://api.mapbox.com"
		],
		"connect-src": [
			"'self'",
			"https://api.mapbox.com",
			"https://a.tiles.mapbox.com",
			"https://b.tiles.mapbox.com",
			"https://events.mapbox.com",
			"https://nominatim.openstreetmap.org",
			"https://tile.openstreetmap.org",
			"https://cdn.jsdelivr.net",
			"https://unpkg.com",
			"https://stackpath.bootstrapcdn.com"
		],
		"img-src": [
			"'self'",
			"data:",
			"blob:",
			"https://res.cloudinary.com",
			"https://images.unsplash.com",
			"https://*.tile.openstreetmap.org",
			"https://tile.openstreetmap.org",
			"https://unpkg.com",
			"https://api.mapbox.com"
		],
		"font-src": [
			"'self'",
			"https://kit.fontawesome.com",
			"https://fonts.gstatic.com"
		]
	}
}));




// Make current user and flash messages available in all templates
app.use((req, res, next) => {
	res.locals.currentUser = req.user || null;
	res.locals.success = req.flash('success') || [];
	res.locals.error = req.flash('error') || [];
	next();
});

// Mount user auth routes
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)


app.get('/', (req, res) => {
    res.render('home')
});


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})


