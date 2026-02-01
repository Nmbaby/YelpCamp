const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

/*
  Minimal User schema: we store an email and allow passport-local-mongoose
  to add username/password (hash & salt) fields and convenience methods.
*/
const UserSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true
	}
}, { timestamps: true });

// Use email as the 'username' field for passport-local-mongoose.
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);