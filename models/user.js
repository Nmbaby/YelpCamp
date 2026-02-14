const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

/*
  User schema: we store an email and allow passport-local-mongoose
  to add username/password (hash & salt) fields and convenience methods.
  We'll use email as the username for authentication.
*/
const UserSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true
	},
	username: {
		type: String,
		sparse: true // allows null values but enforces uniqueness when present
	}
}, { timestamps: true });

// Pre-save hook to set username from email if not provided
UserSchema.pre('save', function(next) {
	if (!this.username && this.email) {
		this.username = this.email.split('@')[0];
	}
	next();
});

// Use email as the 'username' field for passport-local-mongoose.
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);