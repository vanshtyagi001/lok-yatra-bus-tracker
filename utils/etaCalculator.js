const turf = require('@turf/turf');

function calculateETAs(route, buses, passengerStop) {
    if (!route || !route.polyline || route.polyline.length < 2) return [];

    const routeLine = turf.lineString(route.polyline.map(p => [p.lng, p.lat]));
    const startOfLine = turf.point(routeLine.geometry.coordinates[0]); // Get the very first point of the route

    const stopPoint = turf.point([passengerStop.lng, passengerStop.lat]);
    const pointOnLineForStop = turf.nearestPointOnLine(routeLine, stopPoint);
    const stopSlice = turf.lineSlice(startOfLine, pointOnLineForStop, routeLine);
    const distanceToStop = turf.length(stopSlice, { units: 'kilometers' });

    const etas = [];

    buses.forEach(bus => {
        const busPoint = turf.point([bus.lng, bus.lat]);
        const pointOnLineForBus = turf.nearestPointOnLine(routeLine, busPoint);
        const busSlice = turf.lineSlice(startOfLine, pointOnLineForBus, routeLine);
        const distanceToBus = turf.length(busSlice, { units: 'kilometers' });

        
        const remainingDistance = distanceToStop - distanceToBus;

        
        console.log(`[ETA DEBUG] Bus: ${bus.busId}, StopDist: ${distanceToStop.toFixed(2)}km, BusDist: ${distanceToBus.toFixed(2)}km, Remaining: ${remainingDistance.toFixed(2)}km`);

        
        if (remainingDistance > -0.1) { 
            
            const timeHours = remainingDistance / route.averageSpeed;
            const timeMinutes = Math.round(timeHours * 60);

            etas.push({
                busId: bus.busId,
                minutes: Math.max(0, timeMinutes),
                status: 'approaching'
            });
        } else {
            
            etas.push({
                busId: bus.busId,
                minutes: null,
                status: 'passed'
            });
        }
    });

    return etas;
}

module.exports = { calculateETAs };