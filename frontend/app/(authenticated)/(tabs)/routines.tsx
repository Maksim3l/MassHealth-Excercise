import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import RoutinesIcon from '../../../assets/tsxicons/routinesnavbaricon';
import SectionTitle from '../../../components/sectiontitle';
import CreateRoutineButton from '../../../components/createRoutineButton';
import Routinebutton from '../../../components/routinebutton';
import RoutinePlaceholder from '../../../components/routinePlaceholder';

// Define the HTML directly in the component
const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map');
    let markers = [];
    
    window.addEventListener('message', function(event) {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'mapCenterPosition') {
          map.setView([message.payload.lat, message.payload.lng], message.payload.zoom || 13);
        }
        
        if (message.type === 'mapLayers') {
          message.payload.forEach(layer => {
            L.tileLayer(layer.url).addTo(map);
          });
        }
        
        if (message.type === 'customScript') {
          eval(message.payload);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });
  </script>
</body>
</html>
`;

const Routines: React.FC = () => {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  
  const [selectedLocation] = useState({
    latitude: 46.0569,
    longitude: 14.5058
  });
  
  const locations = [
    { latitude: 46.0569, longitude: 14.5058 }, // Ljubljana
    { latitude: 46.2382, longitude: 14.3555 }, // Kranj
    { latitude: 45.5475, longitude: 13.7304 }  // Koper
  ];
  
  const navigateToMap = () => {
    router.push('../map');
  }

  const navigateToPreview = (routineName : string) => {
    router.push(`../routinepreview?routineName=${routineName}`);
  };
  
  const handleWebViewLoad = () => {
    if (webViewRef.current) {
      // Set center position
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'mapCenterPosition',
            payload: {
              lat: ${selectedLocation.latitude},
              lng: ${selectedLocation.longitude},
              zoom: 9
            }
          }));
          true;
        } catch(e) {
          console.error('Error in mapCenterPosition:', e);
          true;
        }
      `);
      
      // Add tile layer
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'mapLayers',
            payload: [
              {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              }
            ]
          }));
          true;
        } catch(e) {
          console.error('Error in mapLayers:', e);
          true;
        }
      `);
      
      // Make map non-interactive
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'customScript',
            payload: "setTimeout(() => { const zoomControl = document.querySelector('.leaflet-control-zoom'); if (zoomControl) zoomControl.style.display = 'none'; map.dragging.disable(); map.touchZoom.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable(); }, 100);"
          }));
          true;
        } catch(e) {
          console.error('Error in customScript:', e);
          true;
        }
      `);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.sectionTitle}>
          <RoutinesIcon color={"#6E49EB"} fill={"white"} />
          <Text style={styles.sectionTitleText}>Routines</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.mapPreviewContainer}
          onPress={navigateToMap}
        >
          {/* Collapsed map view */}
          <View style={styles.mapWrapper}>
            <WebView
              ref={webViewRef}
              source={{ html: leafletHtml }}
              onLoad={handleWebViewLoad}
              onError={(error) => console.error("WebView error:", error.nativeEvent)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={styles.mapWrapper}
              scrollEnabled={false}
              originWhitelist={['*']}
            />
          </View>
          
          {/* Overlay with location text */}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapLocationText}>
              Ljubljana • Kranj • Koper
            </Text>
          </View>
        </TouchableOpacity>
        
        <SectionTitle textOne='Your' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <CreateRoutineButton onPress={() => router.push('../createroutine')}/>
            <Routinebutton routineName='Leg day' onPress={navigateToPreview} />
            <Routinebutton routineName='Chest day' onPress={navigateToPreview} />
            <RoutinePlaceholder />
          </ScrollView>
        </View>

        <SectionTitle textOne='Popular' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <RoutinePlaceholder />
            <RoutinePlaceholder />
            <RoutinePlaceholder />
          </ScrollView>
        </View> 
        
        <SectionTitle textOne='Recommended' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <RoutinePlaceholder />
            <RoutinePlaceholder />
            <RoutinePlaceholder />
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700',
  },
  sectionTitleText: {
    fontWeight: 700,
    fontSize: 32,
    color: "#6E49EB",
    margin: 10
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    margin: 20
  },
  mapPreviewContainer: {
    height: 120,
    margin: 15,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    alignItems: 'center',
  },
  mapLocationText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    padding: 15,
  },
  contentText: {
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row'
  }
});

export default Routines;