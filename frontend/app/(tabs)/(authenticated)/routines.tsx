import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import OSMMapView from '../../../components/OpenStreetMap';
import { SafeAreaView } from 'react-native-safe-area-context';

const Routines: React.FC = () => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 46.0569,
    longitude: 14.5058
  });

  const locations = [
    { latitude: 46.0569, longitude: 14.5058 }, // Ljubljana
    { latitude: 46.2382, longitude: 14.3555 }, // Kranj
    { latitude: 45.5475, longitude: 13.7304 }  // Koper
  ];

  const handleMarkerClick = (location: { latitude: number; longitude: number }) => {
    setSelectedLocation(location);
    // Optional: Auto-expand when marker is clicked
    // setIsMapExpanded(true);
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OSMMapView 
          location={selectedLocation}
          markerLocations={locations}
          zoom={isMapExpanded ? 12 : 10}
          onMarkerClick={handleMarkerClick}
          expanded={isMapExpanded}
          onExpandToggle={toggleMapSize}
        />
        
        <View style={[
          styles.contentArea,
          isMapExpanded ? styles.contentWithExpandedMap : null
        ]}>
          <Text style={styles.contentText}>Your content goes here</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    padding: 15,
  },
  contentWithExpandedMap: {
    marginTop: '70%', // Match the map's height
  },
  contentText: {
    fontSize: 16,
  }
});

export default Routines;