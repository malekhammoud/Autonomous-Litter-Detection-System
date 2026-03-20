import { LitterLocation } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LitterStatsProps {
  data: LitterLocation[];
}

export function LitterStats({ data }: LitterStatsProps) {
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(d => d.status === 'active').length;
    const pickedUp = total - active;
    const pickupRate = total > 0 ? (pickedUp / total * 100).toFixed(1) : '0.0';
    
    return { total, active, pickedUp, pickupRate };
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Litter Statistics</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <View style={[styles.iconBox, { backgroundColor: '#3b82f6' }]}>
                <MaterialCommunityIcons name="format-list-bulleted" size={24} color="white" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Detected</Text>
          </View>

          <View style={styles.statItem}>
             <View style={[styles.iconBox, { backgroundColor: '#10b981' }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={24} color="white" />
            </View>
            <Text style={styles.statValue}>{stats.pickedUp}</Text>
            <Text style={styles.statLabel}>Picked Up</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
             <View style={[styles.iconBox, { backgroundColor: '#ef4444' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="white" />
            </View>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statItem}>
             <View style={[styles.iconBox, { backgroundColor: '#f59e0b' }]}>
                <MaterialCommunityIcons name="chart-pie" size={24} color="white" />
            </View>
            <Text style={styles.statValue}>{stats.pickupRate}%</Text>
            <Text style={styles.statLabel}>Cleanup Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginHorizontal: 5,
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
  },
});
