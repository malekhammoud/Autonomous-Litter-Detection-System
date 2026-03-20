import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserLocation } from '@/hooks/useUserLocation';
import { LitterLocation, fetchLitterDetections, markLitterPickedUp } from '@/services/api';
import React, { useEffect, useMemo, useState } from 'react';
import { useDebug } from '@/context/DebugContext';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface LitterDetectionMapProps {
  litter: LitterLocation[];
  onPickup?: (id: number) => void;
  onSelectDetection?: (detection: LitterLocation) => void;
}

// Dynamically import native maps only on native platforms
let MapViewComponent: any = null;
let MarkerComponent: any = null;
let PolylineComponent: any = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mapsModule = require('react-native-maps');
    MapViewComponent = mapsModule.default;
    MarkerComponent = mapsModule.Marker;
    PolylineComponent = mapsModule.Polyline;
  } catch (err) {
    console.error('Failed to load react-native-maps:', err);
  }
}

export function LitterDetectionMap({ litter, onPickup, onSelectDetection }: LitterDetectionMapProps) {
  const { location, error, loading } = useUserLocation();
  const { isDebugMode, setFakeLocation } = useDebug();
  // removed internal detections state
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<LitterLocation | null>(null);
  const [pickingUpIds, setPickingUpIds] = useState<Set<number>>(new Set()); // Track items currently being picked up
  const mapRef = React.useRef<any>(null);
  const initialRegionSet = React.useRef(false); // Track if we've already set the initial region

  // Removed type-based icon helper as we don't track litter type anymore
  const getIconName = (): any => 'delete'; 

  // Haversine formula for accurate distance in meters
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180;
    const dLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Find nearest detection for dotted line and pointer
  const nearestDetection = useMemo(() => {
    if (!location || litter.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;

    litter.forEach(det => {
      const dist = getDistanceMeters(location.latitude, location.longitude, det.latitude, det.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearest = det;
      }
    });

    return nearest;
  }, [location, litter]);

  // Pointer angle calculation
  const pointerAngle = useMemo(() => {
    if (!location || !nearestDetection || location.heading === undefined) return 0;

    const dLon = (nearestDetection.longitude - location.longitude);
    const y = Math.sin(dLon * Math.PI / 180) * Math.cos(nearestDetection.latitude * Math.PI / 180);
    const x = Math.cos(location.latitude * Math.PI / 180) * Math.sin(nearestDetection.latitude * Math.PI / 180) -
              Math.sin(location.latitude * Math.PI / 180) * Math.cos(nearestDetection.latitude * Math.PI / 180) * Math.cos(dLon * Math.PI / 180);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    // Relative angle = Target Bearing - User Heading
    let relativeAngle = bearing - location.heading;
    return (relativeAngle + 360) % 360;
  }, [location, nearestDetection]);

  // Auto-pickup Logic (Distance < 6m)
  useEffect(() => {
    if (!location) return;

    const checkAutoPickup = async () => {
      const PICKUP_THRESHOLD_METERS = 6; 

      // Only check items NOT already being picked up
      const nearbyLitter = litter.find(det => {
        if (pickingUpIds.has(det.id)) return false; // Skip if already processing

        const dist = getDistanceMeters(location.latitude, location.longitude, det.latitude, det.longitude);
        return dist < PICKUP_THRESHOLD_METERS;
      });

      if (nearbyLitter) {
        console.log(`Auto-picking up litter ID: ${nearbyLitter.id}`);
        
        // Optimistically mark as processing to prevent duplicate requests
        setPickingUpIds(prev => new Set(prev).add(nearbyLitter.id));
        
        // Notify parent instead of handling internally
        if (onPickup) {
             onPickup(nearbyLitter.id);
             // We can't know success here immediately, but we assume parent handles it.
             // Or we could wait? 
             // Ideally we should just call onPickup and let parent update the list.
             // But to keep consistent behavior:
             if (selectedDetection?.id === nearbyLitter.id) {
               setSelectedDetection(null);
             }
             // Cleanup processing set after a short delay or when prop updates
             setTimeout(() => {
                 setPickingUpIds(prev => {
                    const next = new Set(prev);
                    next.delete(nearbyLitter.id);
                    return next;
                 });
             }, 2000);
        }
      }
    };

    const interval = setInterval(checkAutoPickup, 1000); 
    return () => clearInterval(interval);
  }, [location, litter, pickingUpIds, onPickup, selectedDetection]);

  // Fake loading state handling
  useEffect(() => {
      // Just clear loading after a short bit since data is now passed in
      const timer = setTimeout(() => setMapLoading(false), 500);
      return () => clearTimeout(timer);
  }, []);

  // Animate map to user location ONLY on initial load to prevent fighting zoom
  useEffect(() => {
    if (location && mapRef.current && MapViewComponent && !initialRegionSet.current) {
      initialRegionSet.current = true;
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [location]);

  if (loading || !location) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location error: {error}</Text>
        </View>
      </View>
    );
  }

  // Native app with Google Maps
  if (!MapViewComponent || !MarkerComponent) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Maps not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewComponent
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="hybrid"
        zoomEnabled
        scrollEnabled
        pitchEnabled
        onMapReady={() => setMapLoading(false)}
      >
        {/* User Marker with Heading */}
        <MarkerComponent
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            flat={true}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={location.heading} // Rotate based on compass
            draggable={isDebugMode}
            onDragEnd={(e: any) => {
                if (isDebugMode) {
                    setFakeLocation({
                        latitude: e.nativeEvent.coordinate.latitude,
                        longitude: e.nativeEvent.coordinate.longitude,
                    });
                }
            }}
        >
           <View style={styles.userMarkerArrow}>
              {isDebugMode ? (
                  <MaterialCommunityIcons name="cursor-move" size={32} color="#f59e0b" />
              ) : (
                  <MaterialCommunityIcons name="navigation" size={24} color="#3b82f6" />
              )}
           </View>
        </MarkerComponent>

        {/* Connection Line to Nearest Detection */}
        {nearestDetection && PolylineComponent && (
          <PolylineComponent
            coordinates={[
              { latitude: location.latitude, longitude: location.longitude },
              { latitude: nearestDetection.latitude, longitude: nearestDetection.longitude }
            ]}
            strokeColor="#3b82f6"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Litter detection markers */}
        {litter.map((detection) => (
          <MarkerComponent
            key={detection.id}
            coordinate={{
              latitude: detection.latitude,
              longitude: detection.longitude,
            }}
            onPress={() => {
              setSelectedDetection(detection);
              onSelectDetection?.(detection);
            }}
          >
            <View style={[
              styles.markerContainer,
              selectedDetection?.id === detection.id && styles.selectedMarker
            ]}>
              <View style={styles.markerPin}>
                <MaterialCommunityIcons 
                  name="delete" 
                  size={14} 
                  color="#ef4444" 
                />
              </View>
              <View style={styles.markerTriangle} />
            </View>
          </MarkerComponent>
        ))}
      </MapViewComponent>

      {mapLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {/* HUD Overlay */}
      <View style={styles.hudContainer}>
        <Text style={styles.hudText}>Total Active: {litter.length}</Text>
        <Text style={styles.hudText}>
          Nearest: {nearestDetection 
            ? `${getDistanceMeters(location.latitude, location.longitude, nearestDetection.latitude, nearestDetection.longitude).toFixed(0)}m` 
            : '--'}
        </Text>
      </View>

      {/* Compass / Pointer Overlay - Improved UI */}
      {nearestDetection && (
         <View style={styles.pointerContainer}>
            <View style={[styles.pointerArrow, { transform: [{ rotate: `${pointerAngle}deg` }] }]}>
               <MaterialCommunityIcons name="navigation" size={64} color="#ef4444" />
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.pointerText}>
                {getDistanceMeters(
                  location.latitude, 
                  location.longitude, 
                  nearestDetection.latitude, 
                  nearestDetection.longitude
                ).toFixed(0)}m
              </Text>
              <Text style={styles.pointerLabel}>to litter</Text>
            </View>
         </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  pointerContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  distanceBadge: {
    marginTop: 8,
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  pointerArrow: {
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pointerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ef4444',
  },
  pointerLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userMarkerArrow: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  hudContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 8,
  },
  hudText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
    zIndex: 999
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ef4444',
    marginTop: -2,
    transform: [{ translateY: -1 }]
  },
  webFallback: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  webSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  webText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 20,
  },
  detectionsList: {
    width: '100%',
    maxHeight: 300,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  detectionItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detectionIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 12,
    width: 20,
  },
  detectionDetails: {
    flex: 1,
  },
  detectionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  detectionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detectionConfidence: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
    marginTop: 2,
  },
  noDetections: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  webNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
