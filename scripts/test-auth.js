/**
 * Simple smoke test for the YelpCamp auth system.
 *
 * Requirements:
 *  - Start your app (node app.js) so it listens on http://localhost:3000
 *  - Node 18+ (global fetch available)
 *
 * What it verifies:
 *  - Register user A and keep session cookie
 *  - Create a campground as user A
 *  - Edit and delete the campground as user A (should succeed)
 *  - Register user B and try to edit/delete user A's campground (should be disallowed)
 *
 * Notes:
 *  - The script uses application/x-www-form-urlencoded bodies (how the app's forms submit)
 *  - If something fails, the script prints a helpful message and exits with code 1
 */

(async () => {
	const base = 'http://localhost:3000';
	const timeout = ms => new Promise(r => setTimeout(r, ms));

	// Helper to make requests and manage cookies manually
	function mergeCookieJar(current, setCookieHeader) {
		if (!setCookieHeader) return current;
		// Take the cookie before the first semicolon
		const cookiePart = setCookieHeader.split(';')[0].trim();
		// Merge, replace existing cookie with same name
		const parts = current ? current.split('; ').filter(Boolean) : [];
		const name = cookiePart.split('=')[0];
		const filtered = parts.filter(p => !p.startsWith(name + '='));
		filtered.push(cookiePart);
		return filtered.join('; ');
	}

	async function request({ method = 'GET', path = '/', body = null, cookie = '' , redirect = 'manual' }) {
		const headers = {};
		if (cookie) headers['cookie'] = cookie;
		let bodyOpt;
		if (body) {
			// body expected as object; encode as x-www-form-urlencoded (same as forms)
			const params = new URLSearchParams();
			for (const key of Object.keys(body)) {
				params.append(key, body[key]);
			}
			bodyOpt = params.toString();
			headers['content-type'] = 'application/x-www-form-urlencoded';
		}
		const res = await fetch(base + path, {
			method,
			headers,
			body: bodyOpt,
			redirect
		});
		// Try to get set-cookie header (may be null)
		const setCookie = res.headers.get('set-cookie') || null;
		const location = res.headers.get('location') || null;
		const text = await res.text();
		return { res, text, setCookie, location };
	}

	function assert(cond, message) {
		if (!cond) {
			console.error('FAILED:', message);
			process.exit(1);
		} else {
			console.log('OK:', message);
		}
	}

	console.log('Starting auth smoke tests. Ensure the server is running at http://localhost:3000');
	// Quick health check
	try {
		const health = await request({ path: '/' , method: 'GET', redirect: 'follow' });
		assert(health.res.status === 200, 'Server responded on GET /');
	} catch (err) {
		console.error('Error connecting to server - is it running? Start it with `node app.js`');
		console.error(err);
		process.exit(1);
	}

	// Register User A
	let cookieA = '';
	const emailA = `testA+${Date.now()}@example.com`;
	const pass = 'password';
	let r = await request({ method: 'POST', path: '/register', body: { email: emailA, password: pass }, redirect: 'manual' });
	assert(r.res.status === 302, '/register should redirect on success');
	cookieA = mergeCookieJar(cookieA, r.setCookie);
	assert(cookieA, 'Session cookie saved for User A');

	// Create a campground as User A
	const campData = {
		'campground[title]': 'Auth Test Camp',
		'campground[location]': 'Testville',
		'campground[description]': 'Created by test script'
	};
	r = await request({ method: 'POST', path: '/campgrounds', body: campData, cookie: cookieA, redirect: 'manual' });
	assert(r.res.status === 302 && r.location && r.location.startsWith('/campgrounds/'), 'POST /campgrounds should redirect to the new campground');

	// Extract campground id
	const campPath = r.location; // e.g., /campgrounds/<id>
	const campId = campPath.split('/').pop();
	assert(campId && campId.length > 3, 'Extracted campground id');

	// Edit campground as owner (PUT)
	const editData = { 'campground[title]': 'Auth Test Camp - Edited' };
	r = await request({ method: 'PUT', path: `/campgrounds/${campId}`, body: editData, cookie: cookieA, redirect: 'manual' });
	assert(r.res.status === 302 && r.location === `/campgrounds/${campId}`, 'Owner can edit campground (redirects to show page)');

	// Register User B
	let cookieB = '';
	const emailB = `testB+${Date.now()}@example.com`;
	r = await request({ method: 'POST', path: '/register', body: { email: emailB, password: pass }, redirect: 'manual' });
	assert(r.res.status === 302, '/register for User B should redirect on success');
	cookieB = mergeCookieJar(cookieB, r.setCookie);
	assert(cookieB, 'Session cookie saved for User B');

	// User B tries to edit campground (should be disallowed)
	const editByB = { 'campground[title]': 'Hacked Title' };
	r = await request({ method: 'PUT', path: `/campgrounds/${campId}`, body: editByB, cookie: cookieB, redirect: 'manual' });
	// The isAuthor middleware redirects unauthorized users back to /campgrounds/:id
	assert(r.res.status === 302 && r.location === `/campgrounds/${campId}`, 'Non-author edit attempt should redirect back to show page (not allow edit)');

	// User B tries to delete campground (should be disallowed)
	r = await request({ method: 'DELETE', path: `/campgrounds/${campId}`, cookie: cookieB, redirect: 'manual' });
	assert(r.res.status === 302 && r.location === `/campgrounds/${campId}`, 'Non-author delete attempt should redirect back to show page (not allow delete)');

	// Owner deletes campground (should succeed)
	r = await request({ method: 'DELETE', path: `/campgrounds/${campId}`, cookie: cookieA, redirect: 'manual' });
	assert(r.res.status === 302 && r.location === `/campgrounds`, 'Owner can delete campground');

	console.log('All auth smoke tests passed.');
	process.exit(0);
})();
