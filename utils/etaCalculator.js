const turf = require('@turf/turf');

function calculateETAs(route, buses, passengerStop) {
    if (!route || !route.polyline || route.polyline.length < 2) return [];

    // 1. Create the main route line for Turf.js, swapping our [lat, lng] to Turf's [lng, lat]
    const routeLine = turf.lineString(route.polyline.map(p => [p.lng, p.lat]));
    const startOfLine = turf.point(routeLine.geometry.coordinates[0]); // Get the very first point of the route

    // 2. Calculate the distance along the route to the passenger's selected stop
    const stopPoint = turf.point([passengerStop.lng, passengerStop.lat]);
    const pointOnLineForStop = turf.nearestPointOnLine(routeLine, stopPoint);
    const stopSlice = turf.lineSlice(startOfLine, pointOnLineForStop, routeLine);
    const distanceToStop = turf.length(stopSlice, { units: 'kilometers' });

    const etas = [];

    buses.forEach(bus => {
        // 3. For each bus, calculate its distance from the start of the route
        const busPoint = turf.point([bus.lng, bus.lat]);
        const pointOnLineForBus = turf.nearestPointOnLine(routeLine, busPoint);
        const busSlice = turf.lineSlice(startOfLine, pointOnLineForBus, routeLine);
        const distanceToBus = turf.length(busSlice, { units: 'kilometers' });

        // 4. Calculate the remaining distance
        const remainingDistance = distanceToStop - distanceToBus;

        // The crucial debug log
        console.log(`[ETA DEBUG] Bus: ${bus.busId}, StopDist: ${distanceToStop.toFixed(2)}km, BusDist: ${distanceToBus.toFixed(2)}km, Remaining: ${remainingDistance.toFixed(2)}km`);

        // Only calculate ETA for buses that haven't passed the stop yet (or are very close to it)
        if (remainingDistance > -0.1) { // Use a small negative tolerance to handle minor GPS jitter
            // 5. Calculate ETA in minutes
            const timeHours = remainingDistance / route.averageSpeed;
            const timeMinutes = Math.round(timeHours * 60);

            etas.push({
                busId: bus.busId,
                minutes: Math.max(0, timeMinutes) // Ensure ETA is never negative
            });
        }
    });

    return etas;
}

module.exports = { calculateETAs };