// A tiny Nominatim geocoder for server-side use (low-volume use only).
// It fetches the first result for a query and returns GeoJSON Point or null.
async function geocode(query) {
	// Use global fetch available in Node 18+; if not available, install node-fetch.
	if (!query) return null;
	const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
	const res = await fetch(url, {
		headers: { 'User-Agent': 'YelpCamp-Example/1.0 (contact@example.com)' } // be polite per Nominatim policy
	});
	if (!res.ok) return null;
	const data = await res.json();
	if (!Array.isArray(data) || data.length === 0) return null;
	const { lat, lon } = data[0];
	const latN = parseFloat(lat), lonN = parseFloat(lon);
	if (Number.isNaN(latN) || Number.isNaN(lonN)) return null;
	return { type: 'Point', coordinates: [lonN, latN] };
}

module.exports = geocode;
