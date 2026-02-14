/*
 * Database Migration Script
 * This script fixes existing data issues:
 * 1. Adds username field to existing users (derived from email)
 * 2. Ensures all campgrounds have a valid author
 * 3. Ensures all reviews have a valid author
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Campground = require('../models/campground');
const Review = require('../models/review');

// Use the same DB connection logic as app.js
function getDbUrl() {
	const isDev = process.env.NODE_ENV !== 'production';
	if (isDev && process.env.USE_LOCAL_DB !== 'false') {
		return 'mongodb://127.0.0.1:27017/yelp-camp';
	}
	if (process.env.DB_URL) {
		return process.env.DB_URL.trim();
	}
	if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_HOST) {
		const user = encodeURIComponent(process.env.DB_USER);
		const pass = encodeURIComponent(process.env.DB_PASS);
		const host = process.env.DB_HOST;
		const dbName = process.env.DB_NAME || 'yelp-camp';
		return `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
	}
	return 'mongodb://127.0.0.1:27017/yelp-camp';
}

async function fixDatabase() {
	try {
		const dbUrl = getDbUrl();
		console.log('Connecting to database...');
		await mongoose.connect(dbUrl, { family: 4 });
		console.log('✓ Connected to database');

		// Fix 1: Add username to existing users
		console.log('\n--- Fixing User Data ---');
		const usersWithoutUsername = await User.find({ 
			$or: [
				{ username: { $exists: false } },
				{ username: null },
				{ username: '' }
			]
		});
		
		console.log(`Found ${usersWithoutUsername.length} users without username`);
		for (const user of usersWithoutUsername) {
			if (user.email) {
				user.username = user.email.split('@')[0];
				await user.save();
				console.log(`  ✓ Updated user ${user.email} with username: ${user.username}`);
			}
		}

		// Fix 2: Handle campgrounds without authors
		console.log('\n--- Fixing Campground Data ---');
		const campgroundsWithoutAuthor = await Campground.find({
			$or: [
				{ author: { $exists: false } },
				{ author: null }
			]
		});

		console.log(`Found ${campgroundsWithoutAuthor.length} campgrounds without author`);
		
		if (campgroundsWithoutAuthor.length > 0) {
			// Get or create a default "System" user
			let defaultUser = await User.findOne({ email: 'system@yelpcamp.com' });
			if (!defaultUser) {
				console.log('  Creating default system user...');
				defaultUser = new User({ 
					email: 'system@yelpcamp.com',
					username: 'system'
				});
				await User.register(defaultUser, 'SystemPassword123!');
				console.log('  ✓ Created system user');
			}

			for (const campground of campgroundsWithoutAuthor) {
				campground.author = defaultUser._id;
				await campground.save();
				console.log(`  ✓ Updated campground "${campground.title}" with system author`);
			}
		}

		// Fix 3: Handle reviews without authors
		console.log('\n--- Fixing Review Data ---');
		const reviewsWithoutAuthor = await Review.find({
			$or: [
				{ author: { $exists: false } },
				{ author: null }
			]
		});

		console.log(`Found ${reviewsWithoutAuthor.length} reviews without author`);
		
		if (reviewsWithoutAuthor.length > 0) {
			let defaultUser = await User.findOne({ email: 'system@yelpcamp.com' });
			
			// Create system user if it doesn't exist yet
			if (!defaultUser) {
				console.log('  Creating default system user for reviews...');
				defaultUser = new User({ 
					email: 'system@yelpcamp.com',
					username: 'system'
				});
				await User.register(defaultUser, 'SystemPassword123!');
				console.log('  ✓ Created system user');
			}
			
			for (const review of reviewsWithoutAuthor) {
				review.author = defaultUser._id;
				await review.save();
				console.log(`  ✓ Updated review with system author`);
			}
		}

		console.log('\n✓ Database migration completed successfully!');
		console.log('\nSummary:');
		console.log(`  - Updated ${usersWithoutUsername.length} users`);
		console.log(`  - Fixed ${campgroundsWithoutAuthor.length} campgrounds`);
		console.log(`  - Fixed ${reviewsWithoutAuthor.length} reviews`);

	} catch (err) {
		console.error('Migration failed:', err);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		console.log('\nDatabase connection closed');
	}
}

// Run the migration
fixDatabase();
