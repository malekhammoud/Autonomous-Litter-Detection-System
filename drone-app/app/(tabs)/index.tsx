import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native';
import { Link, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDebug } from '@/context/DebugContext';

export default function HomeScreen() {
  const { isDebugMode, setIsDebugMode } = useDebug();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.background}
      >
        <View style={styles.header}>
            <MaterialCommunityIcons name="drone" size={80} color="white" />
            <Text style={styles.title}>Autonomous Litter Detection</Text>
            <Text style={styles.subtitle}>Clean your community with AI</Text>
        </View>

        <View style={styles.content}>
            <Link href="/litter-view" asChild>
                <TouchableOpacity style={styles.mainButton}>
                    <View style={styles.buttonIcon}>
                        <MaterialCommunityIcons name="map-search" size={32} color="#3b5998" />
                    </View>
                    <View>
                        <Text style={styles.buttonTitle}>Litter Detection View</Text>
                        <Text style={styles.buttonSubtitle}>View live map & cleanup stats</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </Link>

            <Link href="/report-litter" asChild>
                <TouchableOpacity style={styles.mainButton}>
                    <View style={styles.buttonIcon}>
                        <MaterialCommunityIcons name="plus-circle" size={32} color="#10b981" />
                    </View>
                    <View>
                        <Text style={styles.buttonTitle}>Report Litter</Text>
                        <Text style={styles.buttonSubtitle}>Add litter location to map</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </Link>

            <View style={styles.debugCard}>
                <View style={styles.debugHeader}>
                    <MaterialCommunityIcons name="bug" size={24} color="#f59e0b" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.debugTitle}>Debug Mode</Text>
                        <Text style={styles.debugSubtitle}>Simulate GPS location</Text>
                    </View>
                    <Switch 
                        value={isDebugMode} 
                        onValueChange={setIsDebugMode} 
                        trackColor={{ false: "#767577", true: "#f59e0b" }}
                    />
                </View>
                {isDebugMode && (
                    <Text style={styles.debugInfo}>
                        Drag your icon on the map to move around.
                    </Text>
                )}
            </View>

            <TouchableOpacity style={[styles.mainButton, styles.disabledButton]} disabled={true}>
                 <View style={styles.buttonIcon}>
                    <MaterialCommunityIcons name="account-circle" size={32} color="#999" />
                 </View>
                 <View>
                    <Text style={[styles.buttonTitle, styles.disabledText]}>User Profile</Text>
                    <Text style={styles.buttonSubtitle}>Coming Soon</Text>
                 </View>
            </TouchableOpacity>

             <TouchableOpacity style={[styles.mainButton, styles.disabledButton]} disabled={true}>
                 <View style={styles.buttonIcon}>
                    <MaterialCommunityIcons name="cog" size={32} color="#999" />
                 </View>
                 <View>
                    <Text style={[styles.buttonTitle, styles.disabledText]}>Settings</Text>
                    <Text style={styles.buttonSubtitle}>Coming Soon</Text>
                 </View>
            </TouchableOpacity>
        </View>

        <Text style={styles.footer}>v1.0.0 - Alpha Build</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    gap: 16,
  },
  mainButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
  },
  buttonIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#f0f4ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  buttonTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  buttonSubtitle: {
      fontSize: 12,
      color: '#666',
  },
  debugCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  debugHeader: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  debugTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
  },
  debugSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
  },
  debugInfo: {
      marginTop: 8,
      fontSize: 12,
      color: '#fcd34d',
      fontStyle: 'italic',
  },
  disabledButton: {
      opacity: 0.8,
      backgroundColor: 'rgba(255,255,255,0.9)',
  },
  disabledText: {
      color: '#999',
  },
  footer: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
  }
});
