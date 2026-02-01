// Provide compatibility shims for deprecated Node APIs that some older dependencies may call.
// In Node 22+, util.isArray is deprecated and triggers a warning in packages that still call it.
// Define util.isArray to delegate to Array.isArray so those packages do not emit the deprecation warning.
const util = require('util');

if (typeof util.isArray === 'undefined') {
	// Keep this minimal and side-effect free; we simply forward to Array.isArray.
	util.isArray = function (val) {
		return Array.isArray(val);
	};
	// Optional small log to make debugging easier when running locally
	if (process.env.NODE_ENV !== 'production') {
		console.info('Applied deprecation shim: util.isArray -> Array.isArray');
	}
}

module.exports = util;
