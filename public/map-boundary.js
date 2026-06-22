// Shared utility to load the official India boundary GeoJSON and overlay it on Leaflet maps
(function () {
    let cachedGeoJson = null;

    window.addIndiaBoundary = async function (mapInstance) {
        if (!mapInstance) return;

        try {
            if (!cachedGeoJson) {
                const response = await fetch('/india-land-simplified.geojson');
                if (!response.ok) {
                    throw new Error('Failed to load India boundary GeoJSON: ' + response.statusText);
                }
                cachedGeoJson = await response.json();
            }

            // Draw the official Indian boundary line overlay
            const boundaryLayer = L.geoJSON(cachedGeoJson, {
                style: {
                    color: '#424242ff',   // Tailwind Red 600 - distinct and premium
                    weight: 3.5,        // Highlight boundary line
                    opacity: 0.5,
                    fillOpacity: 0.0,   // Transparent fill for LineString
                    interactive: false  // Pass through map clicks to elements underneath
                }
            });

            boundaryLayer.addTo(mapInstance);
            return boundaryLayer;
        } catch (error) {
            console.error('Error loading India boundary overlay:', error);
        }
    };
})();
