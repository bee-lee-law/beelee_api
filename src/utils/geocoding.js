class GeocodingUtils {
  // Haversine formula to calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  }

  // Convert bounds string to object
  parseBounds(boundsString) {
    const [swLng, swLat, neLng, neLat] = boundsString.split(',').map(Number);
    return {
      southwest: { lat: swLat, lng: swLng },
      northeast: { lat: neLat, lng: neLng },
    };
  }

  // Convert location string to object
  parseLocation(locationString) {
    const [lng, lat] = locationString.split(',').map(Number);
    return { lat, lng };
  }

  // Check if a point is within bounds
  isPointInBounds(point, bounds) {
    const { lat, lng } = point;
    const { southwest, northeast } = bounds;

    return (
      lat >= southwest.lat &&
      lat <= northeast.lat &&
      lng >= southwest.lng &&
      lng <= northeast.lng
    );
  }

  // Calculate bounding box for a point and radius
  getBoundingBox(lat, lng, radiusInMeters) {
    const latChange = (radiusInMeters / 111320); // 1 degree lat = ~111.32 km
    const lngChange = (radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180)));

    return {
      southwest: {
        lat: lat - latChange,
        lng: lng - lngChange,
      },
      northeast: {
        lat: lat + latChange,
        lng: lng + lngChange,
      },
    };
  }
}

module.exports = new GeocodingUtils();
