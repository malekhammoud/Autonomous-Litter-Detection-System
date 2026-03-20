import { LitterLocation } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface LitterListProps {
  data: LitterLocation[];
}

export function LitterList({ data }: LitterListProps) {
  const renderItem = ({ item }: { item: LitterLocation }) => (
    <View style={styles.item}>
      <View style={[styles.iconContainer, item.status === 'picked_up' ? styles.pickedUpIcon : styles.activeIcon]}>
        <MaterialCommunityIcons 
            name={item.status === 'picked_up' ? "check" : "delete"} 
            size={20} 
            color="white" 
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.coords}>
          {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
        </Text>
        <Text style={styles.date}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.status, item.status === 'picked_up' ? styles.pickedUpText : styles.activeText]}>
            {item.status === 'picked_up' ? 'PICKED UP' : 'ACTIVE'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No litter data available</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeIcon: {
    backgroundColor: '#ef4444',
  },
  pickedUpIcon: {
    backgroundColor: '#10b981',
  },
  details: {
    flex: 1,
  },
  coords: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statusContainer: {
      alignItems: 'flex-end',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  activeText: {
    color: '#ef4444',
  },
  pickedUpText: {
    color: '#10b981',
  },
  emptyContainer: {
      padding: 40,
      alignItems: 'center',
  },
  emptyText: {
      color: '#999',
      fontSize: 16,
  }
});
