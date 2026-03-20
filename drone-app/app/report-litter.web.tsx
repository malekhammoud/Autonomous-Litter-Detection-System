import { useDebug } from '@/context/DebugContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportLitterScreen() {
  const router = useRouter();
  const { location, error, loading } = useUserLocation();
  const { isDebugMode } = useDebug();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleMapClick = (e: any) => {
    const { lngLat } = e;
    setSelectedLocation({ lng: lngLat.lng, lat: lngLat.lat });
    setSubmitMessage(null);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api'}/litter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng,
          }),
        }
      );

      if (response.ok) {
        setSubmitMessage('✓ Litter reported successfully!');
        setSelectedLocation(null);
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setSubmitMessage('Failed to report litter. Try again.');
      }
    } catch (error) {
      console.error('Error reporting litter:', error);
      setSubmitMessage('Error reporting litter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (loading || !location) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location error: {error}</Text>
        </View>
      </View>
    );
  }

  if (!mapboxToken) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mapbox Token Missing</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Litter</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapContainer}>
        <Map
          initialViewState={{
            longitude: location.longitude,
            latitude: location.latitude,
            zoom: 17,
            pitch: 45,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={mapboxToken}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" />

          {/* User Location Marker */}
          <Marker
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="center"
          >
            <View style={styles.userMarker}>
              <MaterialCommunityIcons
                name="navigation"
                size={24}
                color="white"
              />
            </View>
          </Marker>

          {selectedLocation && (
            <Marker
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              anchor="bottom"
            >
              <View style={styles.selectedMarker}>
                <View style={styles.markerPin}>
                  <MaterialCommunityIcons name="plus" size={18} color="white" />
                </View>
                <View style={styles.markerTriangle} />
              </View>
            </Marker>
          )}
        </Map>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.panelContent}>
          <View>
            <Text style={styles.instructionText}>
              {selectedLocation
                ? '📍 Location selected'
                : '👆 Click on the map to report litter'}
            </Text>
            {selectedLocation && (
              <Text style={styles.coordinatesText}>
                Lat: {selectedLocation.lat.toFixed(5)}, Lng: {selectedLocation.lng.toFixed(5)}
              </Text>
            )}
          </View>

          {submitMessage && (
            <Text
              style={[
                styles.messageText,
                submitMessage.includes('✓')
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}
            >
              {submitMessage}
            </Text>
          )}

          {selectedLocation && (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Report Litter</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  mapContainer: {
    flex: 1,
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
  },
  bottomPanel: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    paddingBottom: 24,
  },
  panelContent: {
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  successMessage: {
    color: '#10b981',
  },
  errorMessage: {
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#10b981',
    marginTop: -2,
  },
});
