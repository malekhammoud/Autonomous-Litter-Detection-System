import { useUserLocation } from '@/hooks/useUserLocation';
import { LitterLocation, fetchLitterDetections, markLitterPickedUp } from '@/services/api';
import React, { useEffect, useState } from 'react';
import { useDebug } from '@/context/DebugContext';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import Map, { Marker, NavigationControl, Popup, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LitterDetectionMapProps {
  litter: LitterLocation[];
  onPickup?: (id: number) => void;
  onSelectDetection?: (detection: LitterLocation) => void;
}

export function LitterDetectionMap({ litter, onPickup, onSelectDetection }: LitterDetectionMapProps) {
  const { location, error, loading } = useUserLocation();
  const { isDebugMode, setFakeLocation } = useDebug();
  const [selectedDetection, setSelectedDetection] = useState<LitterLocation | null>(null);
  const mapRef = React.useRef<MapRef>(null);
  useEffect(() => {
    if (!location) return;

    const checkAutoPickup = async () => {
      const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
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

      const PICKUP_THRESHOLD_METERS = 6;
      const nearbyLitter = litter.find(det => {
        if (det.status === 'picked_up') return false;
        const dist = getDistanceMeters(location.latitude, location.longitude, det.latitude, det.longitude);
        return dist < PICKUP_THRESHOLD_METERS;
      });

      if (nearbyLitter && onPickup) {
        onPickup(nearbyLitter.id);
        if (selectedDetection?.id === nearbyLitter.id) {
          setSelectedDetection(null);
        }
      }
    };

    const interval = setInterval(checkAutoPickup, 1000);
    return () => clearInterval(interval);
  }, [location, litter, onPickup, selectedDetection]);

  const nearestDetection = React.useMemo(() => {
    if (!location || litter.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;

    litter.forEach(det => {
      const dist = Math.pow(det.latitude - location.latitude, 2) + 
                   Math.pow(det.longitude - location.longitude, 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = det;
      }
    });

    return nearest;
  }, [location, litter]);

  const lineGeoJson = React.useMemo(() => {
    if (!location || !nearestDetection) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [location.longitude, location.latitude],
          [nearestDetection.longitude, nearestDetection.latitude]
        ]
      },
      properties: {}
    };
  }, [location, nearestDetection]);

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
  
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <View style={styles.container}>
         <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mapbox Token Missing</Text>
          <Text style={styles.subErrorText}>Add MAPBOX_ACCESS_TOKEN to .env.local</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: location.longitude,
          latitude: location.latitude,
          zoom: 17,
          pitch: 45
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-right" />

        {/* User Location Marker */}
        <Marker 
          longitude={location.longitude} 
          latitude={location.latitude} 
          anchor="center"
          draggable={isDebugMode}
          onDragEnd={(e) => {
              if (isDebugMode) {
                  setFakeLocation({
                      latitude: e.lngLat.lat,
                      longitude: e.lngLat.lng,
                  });
              }
          }}
        >
          <View style={[styles.userMarker, isDebugMode && styles.userMarkerDebug, { transform: [{ rotate: `${location.heading || 0}deg` }] }]}>
            <MaterialCommunityIcons 
                name={isDebugMode ? "cursor-move" : "navigation"} 
                size={24} 
                color={isDebugMode ? "#f59e0b" : "white"} 
            />
          </View>
        </Marker>

        {/* Dotted Line to Nearest */}
        {lineGeoJson && (
          <Source id="line-source" type="geojson" data={lineGeoJson}>
            <Layer
              id="line-layer"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Litter Detection Markers (Red Pins) */}
        {litter.map((det) => (
          <Marker
            key={det.id}
            longitude={det.longitude}
            latitude={det.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedDetection(det);
              onSelectDetection?.(det);
            }}
          >
            <View style={[
              styles.markerContainer, 
              selectedDetection?.id === det.id && styles.selectedMarker
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
          </Marker>
        ))}

        {/* Popup for selected item */}
        {selectedDetection && (
          <Popup
            longitude={selectedDetection.longitude}
            latitude={selectedDetection.latitude}
            anchor="bottom"
            onClose={() => setSelectedDetection(null)}
            closeOnClick={false}
          >
            <View style={{ minWidth: 150, padding: 5 }}>
              <Text style={{ fontWeight: 'bold' }}>Detected Litter</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>
                Active
              </Text>
            </View>
          </Popup>
        )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subErrorText: {
    fontSize: 14,
    color: '#666',
  },
  platformBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333'
  },
  userMarker: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMarkerDebug: {
      backgroundColor: 'white',
      borderColor: '#f59e0b',
      borderWidth: 4,
  },
  markerContainer: {
    alignItems: 'center',
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
});
