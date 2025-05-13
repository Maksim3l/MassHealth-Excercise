import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

const DEFAULT_LOCATION = {
  latitude: 46.0569,
  longitude: 14.5058
}

// Define the HTML content directly as a string
const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    #map {
      width: 100%;
      height: 100vh;
    }
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
        
        if (message.type === 'markers') {
          // Clear existing markers
          markers.forEach(marker => map.removeLayer(marker));
          markers = [];
          
          // Add new markers
          message.payload.forEach(markerData => {
            const marker = L.marker([markerData.lat, markerData.lng]).addTo(map);
            if (markerData.icon) {
              marker.setIcon(L.icon(markerData.icon));
            }
            if (markerData.popup) {
              marker.bindPopup(markerData.popup);
            }
            markers.push(marker);
          });
        }
        
        if (message.type === 'customScript') {
          eval(message.payload);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });
    
    // Notify React Native that the map is ready
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady',
        payload: {}
      }));
    } catch (e) {
      console.error('Error sending ready message:', e);
    }
  </script>
</body>
</html>
`;

const Map: React.FC = () => {
  const router = useRouter();
  const [webViewKey] = useState(1);
  const webViewRef = useRef<WebView>(null);
  
  const handleWebViewLoad = () => {
    if (webViewRef.current) {
      // Set center position
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage('${JSON.stringify({
            type: 'mapCenterPosition',
            payload: {
              lat: DEFAULT_LOCATION.latitude,
              lng: DEFAULT_LOCATION.longitude,
              zoom: 13
            }
          })}', '*');
        } catch(e) {
          console.error('Error in mapCenterPosition:', e);
        }
        true;
      `);
      
      // Add tile layer
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage('${JSON.stringify({
            type: 'mapLayers',
            payload: [
              {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              }
            ]
          })}', '*');
        } catch(e) {
          console.error('Error in mapLayers:', e);
        }
        true;
      `);
      
      // Hide zoom controls
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage('${JSON.stringify({
            type: 'customScript',
            payload: `
              setTimeout(() => {
                const zoomControl = document.querySelector('.leaflet-control-zoom');
                if (zoomControl) zoomControl.style.display = 'none';
              }, 100);
            `
          })}', '*');
        } catch(e) {
          console.error('Error in customScript:', e);
        }
        true;
      `);
    }
  };
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={webViewKey}
        source={{ html: leafletHtml }}
        onLoad={handleWebViewLoad}
        onError={(error) => console.error("WebView error:", error.nativeEvent)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.container}
        originWhitelist={['*']}
      />
      
      <SafeAreaView style={styles.button}>
        <TouchableOpacity 
          style={styles.routinesButton}
          onPress={() => router.back()}
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