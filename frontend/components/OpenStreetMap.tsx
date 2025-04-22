import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MapLocation {
  latitude: number;
  longitude: number;
}

interface MapProps {
  location?: MapLocation;
  markerLocations?: MapLocation[];
  zoom?: number;
  onMarkerClick?: (location: MapLocation) => void;
  expanded?: boolean;
  onExpandToggle?: () => void;
}

const DEFAULT_LOCATION: MapLocation = {
  latitude: 46.0569,  // Ljubljana
  longitude: 14.5058
};

const OSMMapView: React.FC<MapProps> = ({ 
  location = DEFAULT_LOCATION,
  markerLocations = [], 
  zoom = 13,
  onMarkerClick,
  expanded = false,
  onExpandToggle 
}) => {
  const markers = markerLocations.map((loc, index) => ({
    id: `marker_${index}`,
    position: { lat: loc.latitude, lng: loc.longitude },
    icon: '📍',
    size: [32, 32],
  }));

  if (markers.length === 0 && location) {
    markers.push({
      id: 'current_location',
      position: { lat: location.latitude, lng: location.longitude },
      icon: '📍',
      size: [32, 32],
    });
  }

  const handleMarkerClick = (marker: any) => {
    const clickedLocation = {
      latitude: marker.position.lat,
      longitude: marker.position.lng
    };
    
    onMarkerClick?.(clickedLocation);
  };

  return (
    <View style={[
      styles.container, 
      expanded ? styles.expanded : styles.collapsed,
    ]}>
      <LeafletView
        mapCenterPosition={{
          lat: location.latitude,
          lng: location.longitude,
        }}
        zoom={zoom}
        mapMarkers={markers}
        mapLayers={[{
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
        }]}
      />
      <TouchableOpacity style={styles.toggleButton} onPress={onExpandToggle}>
        <Text style={styles.toggleText}>{expanded ? 'Collapse' : 'Expand'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
    width: '100%',
    overflow: 'hidden',
  },
  collapsed: {
    height: 200,
  },
  expanded: {
    height: '70%', // This will make it take the top half of the screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'white',
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 5,
    zIndex: 1000,
  },
  toggleText: {
    fontWeight: 'bold',
  },
});

export default OSMMapView;