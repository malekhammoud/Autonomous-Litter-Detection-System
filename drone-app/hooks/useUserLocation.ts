import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { useDebug } from '@/context/DebugContext';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  heading?: number; // Add heading support
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  
  // Use Debug Context
  const { isDebugMode, fakeLocation } = useDebug();

  // Effect for handling debug mode changes and fake location updates
  useEffect(() => {
    if (isDebugMode) {
      // In debug mode, we just set the location to the fake one
      setLocation(prev => ({
        latitude: fakeLocation.latitude,
        longitude: fakeLocation.longitude,
        accuracy: 5,
        timestamp: Date.now(),
        heading: prev?.heading || 0, // Preserve heading if possible, or we could add a fake heading too
      }));
      setLoading(false);
      
      // Cleanup any real location subscriptions if they were active
      if (locationSubscriptionRef.current) {
        try { locationSubscriptionRef.current.remove(); } catch(e) {}
        locationSubscriptionRef.current = null;
      }
      if (headingSubscriptionRef.current) {
        try { headingSubscriptionRef.current.remove(); } catch(e) {}
        headingSubscriptionRef.current = null;
      }
      
      return; 
    }
  }, [isDebugMode, fakeLocation]);

  // Original Effect for real location tracking
  useEffect(() => {
    if (isDebugMode) return; // Skip if in debug mode

    let isMounted = true;
    setLoading(true); // Reset loading when switching back to real GPS

    const startLocationTracking = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          if (isMounted) {
            setError('Location permission denied');
            setLoading(false);
          }
          return;
        }

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        if (isMounted) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy || undefined,
            timestamp: currentLocation.timestamp,
            heading: currentLocation.coords.heading || 0,
          });
          setLoading(false);
        }

        // Subscribe to location updates
        const locSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // Update every 1 second
            distanceInterval: 1, // Update every 1 meter
          },
          (newLocation) => {
            if (isMounted) {
              setLocation(prev => ({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                accuracy: newLocation.coords.accuracy || undefined,
                timestamp: newLocation.timestamp,
                heading: prev?.heading || 0, // Preserve heading if not in location update
              }));
            }
          }
        );
        locationSubscriptionRef.current = locSub;

        // Subscribe to heading updates separately for smoother compass
        const headSub = await Location.watchHeadingAsync((newHeading) => {
            if (isMounted) {
                setLocation(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        heading: newHeading.magHeading
                    };
                });
            }
        });
        headingSubscriptionRef.current = headSub;

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to get location');
          setLoading(false);
        }
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscriptionRef.current) {
        try {
          locationSubscriptionRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors on web
          console.warn('Failed to remove location subscription:', e);
        }
      }
      if (headingSubscriptionRef.current) {
        try {
          headingSubscriptionRef.current.remove();
        } catch (e) {
           // Ignore cleanup errors on web
           console.warn('Failed to remove heading subscription:', e);
        }
      }
    };
  }, [isDebugMode]); // Re-run when debug mode toggles

  return { location, error, loading };
}
