const mongoose = require('mongoose');

// Keep original exec
const originalExec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = function patchedExec() {
	// Convert args to array and detect callback (last or only arg)
	const args = Array.prototype.slice.call(arguments);
	let cb = null;
	if (args.length > 0 && typeof args[args.length - 1] === 'function') {
		cb = args.pop();
	} else if (args.length === 1 && typeof args[0] === 'function') {
		cb = args[0];
		args.length = 0;
	}

	// If callback provided, call original exec (returns Promise) and forward results to callback
	if (typeof cb === 'function') {
		return originalExec.call(this, ...args)
			.then((res) => cb(null, res))
			.catch((err) => cb(err));
	}

	// No callback -> behave normally (Promise)
	return originalExec.apply(this, args);
};

module.exports = mongoose;
