import { LitterDetectionMap } from '@/components/LitterDetectionMap';
import { LitterList } from '@/components/LitterList';
import { LitterStats } from '@/components/LitterStats';
import { fetchLitterDetections, markLitterPickedUp, LitterLocation } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ViewMode = 'map' | 'list' | 'stats';
type SyncStatus = 'synced' | 'syncing' | 'error';

export default function LitterDetectionScreen() {
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  const [data, setData] = useState<LitterLocation[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const isUpdatingRef = React.useRef(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadData = React.useCallback(async () => {
    if (isUpdatingRef.current) return;

    setSyncStatus('syncing');
    try {
      const allLitter = await fetchLitterDetections();
      setData(allLitter);
      setSyncStatus('synced');
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
        loadData();
    }, 5000); 
    return () => clearInterval(interval);
  }, [loadData]);

  const renderContent = () => {
    switch (currentView) {
      case 'map':
        return (
          <LitterDetectionMap 
            litter={data.filter(item => item.status === 'active')}
            onPickup={async (id) => {
               console.log('Detected pickup for ID:', id);
               
               // 1. Pause polling
               isUpdatingRef.current = true;
               
               // 2. Optimistically update local state immediately
               setData(prev => prev.map(item => item.id === id ? { ...item, status: 'picked_up' as const } : item));
               
               // 3. Call API to persist change
               try {
                 const success = await markLitterPickedUp(id);
                 if (success) {
                   console.log('Successfully marked picked up on server');
                   // 4. Reload data to ensure sync (only AFTER success)
                   isUpdatingRef.current = false;
                   loadData();
                 } else {
                   console.error('Server failed to mark picked up');
                   isUpdatingRef.current = false;
                   // Could revert optimistic update here if needed
                 }
               } catch (err) {
                 console.error('Pickup error:', err);
                 isUpdatingRef.current = false;
               }
            }}
          />
        );
      case 'list':
        return <LitterList data={data} />;
      case 'stats':
        return <LitterStats data={data} />;
      default:
        return <LitterDetectionMap />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: insets.top + 44 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <MaterialCommunityIcons name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Litter Detection View</Text>
        <View style={{ width: 20 }} /> 
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Floating Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, currentView === 'map' && styles.navItemActive]}
            onPress={() => setCurrentView('map')}
          >
            <MaterialCommunityIcons name="map" size={24} color={currentView === 'map' ? '#3b82f6' : '#666'} />
            <Text style={[styles.navText, currentView === 'map' && styles.navTextActive]}>Map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, currentView === 'list' && styles.navItemActive]}
            onPress={() => setCurrentView('list')}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={24} color={currentView === 'list' ? '#3b82f6' : '#666'} />
            <Text style={[styles.navText, currentView === 'list' && styles.navTextActive]}>List</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, currentView === 'stats' && styles.navItemActive]}
            onPress={() => setCurrentView('stats')}
          >
            <MaterialCommunityIcons name="chart-bar" size={24} color={currentView === 'stats' ? '#3b82f6' : '#666'} />
            <Text style={[styles.navText, currentView === 'stats' && styles.navTextActive]}>Stats</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.navItem}>
             <View style={[
                 styles.syncIndicator, 
                 syncStatus === 'synced' ? styles.syncGreen : 
                 syncStatus === 'syncing' ? styles.syncYellow : styles.syncRed
             ]} />
             <Text style={styles.navText}>
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : 'Error'}
             </Text>
          </View>
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
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navItemActive: {
    // borderBottomWidth: 2,
    // borderBottomColor: '#3b82f6',
  },
  navText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#3b82f6',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#eee',
    marginHorizontal: 5,
  },
  syncIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginBottom: 2,
  },
  syncGreen: {
      backgroundColor: '#10b981',
  },
  syncYellow: {
      backgroundColor: '#f59e0b',
  },
  syncRed: {
      backgroundColor: '#ef4444',
  },
});
