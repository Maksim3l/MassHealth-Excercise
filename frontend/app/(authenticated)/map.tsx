import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const DEFAULT_LOCATION = {
  latitude: 46.0569,
  longitude: 14.5058
}

// Update the HTML content to handle user location
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
    .user-location-marker {
      border-radius: 50%;
      width: 16px;
      height: 16px;
      background-color: #4285F4;
      border: 3px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
    }
    .accuracy-circle {
      border-radius: 50%;
      background-color: rgba(66, 133, 244, 0.2);
      border: 1px solid rgba(66, 133, 244, 0.5);
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
    let userMarker = null;
    let accuracyCircle = null;
    
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
        
        if (message.type === 'userLocation') {
          // Remove previous user marker and accuracy circle
          if (userMarker) map.removeLayer(userMarker);
          if (accuracyCircle) map.removeLayer(accuracyCircle);
          
          // Create custom user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          userMarker = L.marker([message.payload.lat, message.payload.lng], {
            icon: userIcon,
            zIndexOffset: 1000
          }).addTo(map);
          
          // Add accuracy circle if available
          if (message.payload.accuracy) {
            accuracyCircle = L.circle([message.payload.lat, message.payload.lng], {
              radius: message.payload.accuracy,
              className: 'accuracy-circle'
            }).addTo(map);
          }
          
          // Center map on user location if requested
          if (message.payload.center) {
            map.setView([message.payload.lat, message.payload.lng], message.payload.zoom || 16);
          }
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
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Subscribe to location updates
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;
    
    const setupLocation = async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          setErrorMsg('Location permission denied');
          return;
        }
        
        // Get initial location
        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        if (isMounted) {
          console.log('Initial position obtained:', initialPosition.coords);
          setUserLocation({
            latitude: initialPosition.coords.latitude,
            longitude: initialPosition.coords.longitude,
          });
        }
        
        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 300000,     // Update interval
            distanceInterval: 70,   // Update if moved 10 meters
          },
          (newLocation) => {
            if (isMounted) {
              //console.log('Location updated:', newLocation.coords);
              setUserLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              });
            }
          }
        );
      } catch (error) {
        console.error('Error setting up location:', error);
        setErrorMsg('Error getting location');
      }
    };
    
    setupLocation();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  // updates map when users location changes
  useEffect(() => {
    if (webViewRef.current && userLocation) {
      //console.log('Sending location to map:', userLocation);
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'userLocation',
            payload: {
              lat: ${userLocation.latitude},
              lng: ${userLocation.longitude},
              accuracy: ${userLocation.accuracy || 0},
              center: true
            }
          }));
          true;
        } catch(e) {
          console.error('Error updating user location:', e);
          true;
        }
      `);
    }
  }, [userLocation]);
  
  const handleWebViewLoad = () => {
    if (webViewRef.current) {
      // Set center position
      const centerLat = userLocation?.latitude || DEFAULT_LOCATION.latitude;
      const centerLng = userLocation?.longitude || DEFAULT_LOCATION.longitude;
      
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'mapCenterPosition',
            payload: {
              lat: ${centerLat},
              lng: ${centerLng},
              zoom: 13
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
      
      // If we have user location, show it
      if (userLocation) {
        webViewRef.current.injectJavaScript(`
          try {
            window.postMessage(JSON.stringify({
              type: 'userLocation',
              payload: {
                lat: ${userLocation.latitude},
                lng: ${userLocation.longitude},
                accuracy: ${userLocation.accuracy || 0},
                center: true
              }
            }));
            true;
          } catch(e) {
            console.error('Error in userLocation:', e);
            true;
          }
        `);
      }
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
      
      <SafeAreaView style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => {
            if (userLocation) {
              webViewRef.current?.injectJavaScript(`
                try {
                  window.postMessage(JSON.stringify({
                    type: 'userLocation',
                    payload: {
                      lat: ${userLocation.latitude},
                      lng: ${userLocation.longitude},
                      accuracy: ${userLocation.accuracy || 0},
                      center: true,
                      zoom: 16
                    }
                  }));
                  true;
                } catch(e) {
                  console.error('Error centering on user location:', e);
                  true;
                }
              `);
            } else {
              Alert.alert('Location not available', 'Please enable location services and try again.');
            }
          }}
        >
          <Text style={styles.buttonText}>My Location</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  backButton: {
    backgroundColor: '#6E49EB',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButton: {
    backgroundColor: '#4285F4',
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
  }
});

export default Map;