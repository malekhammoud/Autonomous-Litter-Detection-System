export interface LitterDetection {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  confidence: number;
  timestamp: string;
  description?: string;
}

// Mock detection data - centered around San Francisco area
export const mockDetections: LitterDetection[] = [
  {
    id: '1',
    latitude: 37.7749,
    longitude: -122.4194,
    type: 'plastic_bag',
    confidence: 0.95,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    description: 'Plastic bag on ground'
  },
  {
    id: '2',
    latitude: 37.7755,
    longitude: -122.4185,
    type: 'bottle',
    confidence: 0.92,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    description: 'Plastic bottle'
  },
  {
    id: '3',
    latitude: 37.7742,
    longitude: -122.4210,
    type: 'paper',
    confidence: 0.88,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    description: 'Paper waste'
  },
  {
    id: '4',
    latitude: 37.7760,
    longitude: -122.4200,
    type: 'plastic_bag',
    confidence: 0.91,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    description: 'Plastic bag near tree'
  },
  {
    id: '5',
    latitude: 37.7745,
    longitude: -122.4175,
    type: 'can',
    confidence: 0.89,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    description: 'Aluminum can'
  },
  {
    id: '6',
    latitude: 37.7750,
    longitude: -122.4205,
    type: 'bottle',
    confidence: 0.93,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    description: 'Glass bottle'
  },
  {
    id: '7',
    latitude: 37.7765,
    longitude: -122.4188,
    type: 'plastic_bag',
    confidence: 0.87,
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    description: 'Plastic bag by fence'
  },
  {
    id: '8',
    latitude: 37.7738,
    longitude: -122.4192,
    type: 'paper',
    confidence: 0.85,
    timestamp: new Date(Date.now() - 4200000).toISOString(),
    description: 'Discarded paper'
  }
];

export async function fetchDetections(
  latitude?: number,
  longitude?: number,
  radiusKm?: number
): Promise<LitterDetection[]> {
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      if (latitude && longitude && radiusKm) {
        // Filter detections within radius
        const filtered = mockDetections.filter(detection => {
          const distance = calculateDistance(
            latitude,
            longitude,
            detection.latitude,
            detection.longitude
          );
          return distance <= radiusKm;
        });

        // If no static mock data found nearby, generate some dynamic data for demo purposes
        if (filtered.length === 0) {
          const dynamicDetections = generateDynamicDetections(latitude, longitude, radiusKm);
          resolve(dynamicDetections);
        } else {
          resolve(filtered);
        }
      } else {
        resolve(mockDetections);
      }
    }, 500);
  });
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate random detections around a point for demo purposes
function generateDynamicDetections(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): LitterDetection[] {
  const types = ['plastic_bag', 'bottle', 'can', 'paper', 'mask', 'cup'];
  const count = 5 + Math.floor(Math.random() * 5); // 5-10 items
  const detections: LitterDetection[] = [];

  for (let i = 0; i < count; i++) {
    // Random point within radius (approximate)
    // 1 degree lat ~ 111km
    const r = (radiusKm * Math.sqrt(Math.random())) / 111;
    const theta = Math.random() * 2 * Math.PI;
    
    const latOffset = r * Math.cos(theta);
    const lonOffset = (r * Math.sin(theta)) / Math.cos(centerLat * Math.PI / 180);

    const type = types[Math.floor(Math.random() * types.length)];
    
    detections.push({
      id: `dyn-${Date.now()}-${i}`,
      latitude: centerLat + latOffset,
      longitude: centerLon + lonOffset,
      type,
      confidence: 0.7 + (Math.random() * 0.29),
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      description: `Detected ${type.replace('_', ' ')}`
    });
  }
  
  return detections;
}
