// Leaflet map helpers for YelpCamp
// - initMapWithCampgrounds(fetchUrl) fetches campgrounds and places markers.
// - initSingleCampground(campground) centers the map on one campground and shows a marker.
//
// NOTE: Make sure to include Leaflet's CSS/JS in your layout or page:
// <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
// And include this script after Leaflet: <script src="/javascripts/leaflet-maps.js"></script>

(function (global) {
	// default starting center (world view) & zoom
	const DEFAULT_CENTER = [20, 0];
	const DEFAULT_ZOOM = 2;

	// URLs for Leaflet assets (free OpenStreetMap client)
	const LEAFLET_CSS = 'https://unpkg.com/leaflet/dist/leaflet.css';
	const LEAFLET_JS = 'https://unpkg.com/leaflet/dist/leaflet.js';

	// Ensure Leaflet is loaded (dynamically inject CSS and JS if needed).
	function ensureLeafletLoaded(timeout = 5000) {
		return new Promise((resolve, reject) => {
			if (typeof L !== 'undefined') return resolve();
			// Add CSS if missing
			if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = LEAFLET_CSS;
				document.head.appendChild(link);
			}
			// If script already present, wait until L becomes available
			const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`);
			if (existingScript) {
				const wait = setInterval(() => {
					if (typeof L !== 'undefined') {
						clearInterval(wait);
						resolve();
					}
				}, 50);
				return setTimeout(() => {
					clearInterval(wait);
					reject(new Error('Leaflet load timeout'));
				}, timeout);
			}
			// Inject script and resolve when loaded
			const script = document.createElement('script');
			script.src = LEAFLET_JS;
			script.onload = () => {
				if (typeof L !== 'undefined') resolve();
				else reject(new Error('Leaflet loaded but L is undefined'));
			};
			script.onerror = () => reject(new Error('Failed to load Leaflet script'));
			document.head.appendChild(script);
		});
	}

	// Create a map instance in the element with id "map" if not already created
	// Make createMap asynchronous so it can wait for Leaflet if necessary.
	async function createMap(elementId = 'map', center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM) {
		// Wait and catch failures to provide a helpful message (e.g., CSP blocking external assets)
		try {
			await ensureLeafletLoaded();
		} catch (err) {
			console.error('Leaflet failed to load:', err);
			const mapEl = document.getElementById(elementId);
			if (mapEl) {
				mapEl.innerHTML =
					'<div style="padding:1rem;border:1px solid #f5c6cb;background:#f8d7da;color:#721c24">' +
					'<strong>Map failed to load.</strong> Leaflet assets could not be loaded. ' +
					'This is commonly caused by a restrictive Content Security Policy (CSP). ' +
					'You can either update the server CSP to allow the Leaflet CDN (unpkg.com / cdn.jsdelivr.net) ' +
					'and OpenStreetMap tile servers, or host the Leaflet CSS/JS files locally and load them from /public.' +
					'</div>';
			}
			return null;
		}

		let mapEl = document.getElementById(elementId);
		if (!mapEl) {
			console.warn('createMap: no element with id', elementId);
			return null;
		}
		// Prevent re-creating if map already exists
		if (mapEl._leaflet_map) return mapEl._leaflet_map;

		// Ensure the container has a visible height (Leaflet needs a non-zero height to render)
		if (!mapEl.style.height || mapEl.style.height === '') {
			mapEl.style.height = '400px';
		}

		const map = L.map(elementId).setView(center, zoom);
		// Use OpenStreetMap tiles (free). attribution required by OSM.
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);

		// In some layouts the map container may be hidden or not yet fully styled.
		// invalidateSize tells Leaflet to recalculate the map size and paints tiles properly.
		setTimeout(() => {
			try { map.invalidateSize(); } catch (e) { /* ignore */ }
		}, 200);

		mapEl._leaflet_map = map;
		// container to keep track of markers so we can clear later
		map._yc_markers = [];
		return map;
	}

	// Add a marker safely (checks geometry) and bind popupText (HTML)
	function addMarker(map, campground) {
		if (!map || !campground || !campground.geometry || !Array.isArray(campground.geometry.coordinates)) {
			return;
		}
		const [lng, lat] = campground.geometry.coordinates;
		if (typeof lat !== 'number' || typeof lng !== 'number') return;
		const marker = L.marker([lat, lng]).addTo(map);
		if (campground.popupText) {
			marker.bindPopup(campground.popupText, { maxWidth: 300 });
		}
		map._yc_markers.push(marker);
	}

	// Clear all markers from map (useful for reloading)
	function clearMarkers(map) {
		if (!map || !map._yc_markers) return;
		map._yc_markers.forEach(m => map.removeLayer(m));
		map._yc_markers = [];
	}

	// Fetch campgrounds from backend and add them as markers
	// Update init helpers to wait for DOM + Leaflet, and to be async so callers can await them.
	async function initMapWithCampgrounds(options = {}) {
		await new Promise(r => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r); else r(); });
		const map = await createMap(options.elementId || 'map', options.center || DEFAULT_CENTER, typeof options.zoom === 'number' ? options.zoom : DEFAULT_ZOOM);
		if (!map) return;

		const fetchUrl = options.fetchUrl || '/campgrounds.json';

		try {
			const res = await fetch(fetchUrl, { headers: { 'Accept': 'application/json' } });
			if (!res.ok) {
				console.error('Failed to fetch campgrounds:', res.statusText);
				return;
			}
			const campgrounds = await res.json();
			// Clear existing markers then add each campground that has geometry
			clearMarkers(map);
			campgrounds.forEach(cg => {
				addMarker(map, cg);
			});
			// Optionally, if you want to fit bounds to markers:
			const coords = campgrounds
				.filter(cg => cg.geometry && Array.isArray(cg.geometry.coordinates))
				.map(cg => [cg.geometry.coordinates[1], cg.geometry.coordinates[0]]); // [lat, lng]
			if (coords.length > 0) {
				const bounds = L.latLngBounds(coords);
				map.fitBounds(bounds.pad(0.2));
			}
		} catch (err) {
			console.error('Error initializing map with campgrounds:', err);
		}
	}

	// Initialize a map for a single campground (useful for show page).
	// `campground` should be the server-rendered object or a JS object with geometry and popupText.
	async function initSingleCampground(campground, options = {}) {
		await new Promise(r => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r); else r(); });
		const elementId = options.elementId || 'map';
		const zoom = typeof options.zoom === 'number' ? options.zoom : 13;
		const mapEl = document.getElementById(elementId);
		if (!mapEl) return;
		if (!campground || !campground.geometry || !Array.isArray(campground.geometry.coordinates)) {
			// Friendly feedback if the campground has no coordinates
			mapEl.innerHTML = '<p class="text-muted">Map unavailable: location not set for this campground.</p>';
			console.warn('initSingleCampground: missing geometry for campground', campground && campground._id);
			return;
		}
		const [lng, lat] = campground.geometry.coordinates;
		const map = await createMap(elementId, [lat, lng], zoom);
		clearMarkers(map);
		addMarker(map, campground);
		map.setView([lat, lng], zoom);
		try { map.invalidateSize(); } catch (e) { /* ignore */ }
	}

	// Export API (no changes to names)
	global.YCLeaflet = {
		initMapWithCampgrounds,
		initSingleCampground,
		createMap,
		addMarker,
		clearMarkers
	};
})(window);
