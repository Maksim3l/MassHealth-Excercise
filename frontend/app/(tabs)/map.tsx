import React from 'react';
import { LeafletView } from 'react-native-leaflet-view';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const DEFAULT_LOCATION = {
  latitude:  46.0569,
  longitude: 14.5058
}

const Map: React.FC = () => {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <LeafletView
        mapCenterPosition={{
          lat: DEFAULT_LOCATION.latitude,
          lng: DEFAULT_LOCATION.longitude,
        }}
        mapLayers={[
          {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          },
        ]}
        injectedJavaScript={`
          setTimeout(() => {
            const zoomControl = document.querySelector('.leaflet-control-zoom');
            if (zoomControl) zoomControl.style.display = 'none';
          }, 100);
        `}
      />
      
      <SafeAreaView style={styles.button}>
      <TouchableOpacity 
        style={styles.routinesButton}
        onPress={() => router.push('/(authenticated)/routines')}
      >
        <Text style={styles.buttonText}>Go back</Text>
      </TouchableOpacity>
      </SafeAreaView>
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  routinesButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6E49EB',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    marginHorizontal: 10,
    marginVertical: 20
  }
});

export default Map;