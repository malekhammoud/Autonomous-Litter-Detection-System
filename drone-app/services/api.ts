const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LitterLocation {
  id: number;
  latitude: number;
  longitude: number;
  status: 'active' | 'picked_up';
  created_at?: string;
}

/**
 * Fetch litter detections with optional status filter
 */
export async function fetchLitterDetections(status?: 'active' | 'picked_up'): Promise<LitterLocation[]> {
  try {
    const url = status 
      ? `${API_BASE_URL}/litter?status=${status}&t=${Date.now()}`
      : `${API_BASE_URL}/litter?t=${Date.now()}`;
      
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    
    return data.map((item: any) => ({
      ...item,
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
    }));
  } catch (error) {
    console.error('Failed to fetch litter:', error);
    return [];
  }
}

/**
 * Mark a litter item as picked up
 */
export async function markLitterPickedUp(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/litter/${id}/pickup`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to mark litter picked up:', error);
    return false;
  }
}
