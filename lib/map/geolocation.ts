/**
 * Geolocation utilities for Map view
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Get user's current location
 */
export function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two coordinates (in miles)
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'Nearby';
  } else if (miles < 1) {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles)} mi`;
  }
}

/**
 * Check if coordinates are within radius
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusMiles;
}

/**
 * Get coordinates from address (geocoding)
 * This would integrate with Google Maps Geocoding API or similar
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    // TODO: Integrate geocoding API
    // For now, return null
    console.log('Geocoding:', address);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Get address from coordinates (reverse geocoding)
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  try {
    // TODO: Integrate reverse geocoding API
    console.log('Reverse geocoding:', coords);
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

