import { useUserLocation } from '@/hooks/useUserLocation';
import { LitterDetection, fetchDetections } from '@/services/mockData';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export function StatsPanel() {
  const { location } = useUserLocation();
  const [detections, setDetections] = useState<LitterDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
  });

  useEffect(() => {
    const loadDetections = async () => {
      if (location) {
        try {
          const data = await fetchDetections(location.latitude, location.longitude, 5);
          setDetections(data);

          // Calculate stats
          const byType: Record<string, number> = {};
          data.forEach((detection) => {
            byType[detection.type] = (byType[detection.type] || 0) + 1;
          });

          setStats({
            total: data.length,
            byType,
          });
          setLoading(false);
        } catch (err) {
          console.error('Failed to load detections:', err);
          setLoading(false);
        }
      }
    };

    loadDetections();
  }, [location]);

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      plastic_bag: '🛍️',
      bottle: '🍾',
      can: '🥫',
      paper: '📄',
    };
    return icons[type] || '🗑️';
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      plastic_bag: 'Plastic Bags',
      bottle: 'Bottles',
      can: 'Cans',
      paper: 'Paper',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Detected</Text>
        <Text style={styles.totalCount}>{stats.total}</Text>
        <Text style={styles.subtitle}>items</Text>
      </View>

      {Object.keys(stats.byType).length > 0 ? (
        <ScrollView style={styles.typesList} showsVerticalScrollIndicator={false}>
          {Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <View key={type} style={styles.typeItem}>
                <Text style={styles.typeIcon}>{getTypeIcon(type)}</Text>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeLabel}>{getTypeLabel(type)}</Text>
                  <Text style={styles.typeCount}>{count} detected</Text>
                </View>
                <Text style={styles.typeNumber}>{count}</Text>
              </View>
            ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No litter detected nearby</Text>
        </View>
      )}

      {detections.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Detection</Text>
          {detections.length > 0 && (
            <View style={styles.recentItem}>
              <Text style={styles.recentType}>{detections[0].type}</Text>
              <Text style={styles.recentDesc}>{detections[0].description}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: '40%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  typesList: {
    maxHeight: 120,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  typeCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  typeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  recentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recentTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  recentItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
  },
  recentType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  recentDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
