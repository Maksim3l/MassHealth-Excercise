import React, { useState, useRef, useEffect } from 'react';
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
import * as Location from 'expo-location';
import * as Paho from 'paho-mqtt'


const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
    .user-location-marker {
      border-radius: 50%;
      width: 12px;
      height: 12px;
      background-color: #4285F4;
      border: 2px solid white;
      box-shadow: 0 0 3px rgba(0,0,0,0.3);
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
            markers.push(marker);
          });
        }
        
        if (message.type === 'userLocation') {
          // Remove previous user marker
          if (userMarker) map.removeLayer(userMarker);
          
          // Create custom user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          
          userMarker = L.marker([message.payload.lat, message.payload.lng], {
            icon: userIcon,
            zIndexOffset: 1000
          }).addTo(map);
          
          // Add this block to center the map if center is true
          if (message.payload.center) {
            map.setView([message.payload.lat, message.payload.lng], 
                        message.payload.zoom || 13);
          }
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
  const [userLocation, setUserLocation] = useState({
    latitude: 46.0569,  // Default to Ljubljana
    longitude: 14.5058
  });
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState<string | null>(null);
  
  // Fixed locations
  const locations = [
    { latitude: 46.0569, longitude: 14.5058 }, // Ljubljana
    { latitude: 46.2382, longitude: 14.3555 }, // Kranj
    { latitude: 45.5475, longitude: 13.7304 }  // Koper
  ];
  
  // Fetch user location
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;
    
    const getLocation = async () => {
      try {
        setIsLoading(true);
        
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          setIsLoading(false);
          return;
        }
        
        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        if (isMounted) {
          //console.log('Got location:', location.coords);
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          // Get city name
          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
            
            if (geocode.length > 0 && geocode[0].city) {
              setCity(geocode[0].city);
            }
          } catch (error) {
            console.error("Error getting city name:", error);
          }
        }
        
        // Start watching position updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 300000,    // Update every 5 minuten
            distanceInterval: 70,  // Update if moved 100 meters 
          },
          (newLocation) => {
            if (isMounted) {
              //console.log('Location updated:', newLocation.coords);
              setUserLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude
              });
            }
          }
        );
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    getLocation();
    
    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  // Update map when location changes
  useEffect(() => {
    if (webViewRef.current && !isLoading) {
      // Add user location marker
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'userLocation',
            payload: {
              lat: ${userLocation.latitude},
              lng: ${userLocation.longitude},
              center: true, // Add this line to center the map
              zoom: 13 // You can adjust zoom level as needed
            }
          }));
          true;
        } catch(e) {
          console.error('Error in userLocation:', e);
          true;
        }
      `);
    }
  }, [userLocation, isLoading]);


  useEffect(() => {
    const client = global.mqttClient;

    if (client && client.isConnected() && userLocation && !isLoading) {
      try{
        const locationMessage = {
          userId: global.userId,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          timestamp: new Date().toISOString()
        }

        const message = new Paho.Message(JSON.stringify(locationMessage));
        message.destinationName = 'user/locations';
        message.qos = 0;
        message.retained = false

        client.send(message);
        console.log('Location published via MQTT');

      } catch(error){
        console.error('Error publishing location via MQTT', error)
      }
    }
  }, [userLocation, isLoading] )
  
  const navigateToMap = () => {
    router.push('../map');
  }

  const navigateToPreview = (routineName: string) => {
    router.push(`../routinepreview?routineName=${routineName}`);
  };
  
  const handleWebViewLoad = () => {
    if (webViewRef.current) {
      // Set center position to user's location
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'mapCenterPosition',
            payload: {
              lat: ${userLocation.latitude},
              lng: ${userLocation.longitude},
              zoom: 13 // Use higher zoom for better view of user's location
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
      
      // Add markers for locations
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'markers',
            payload: [
              { lat: 46.0569, lng: 14.5058 },
              { lat: 46.2382, lng: 14.3555 },
              { lat: 45.5475, lng: 13.7304 }
            ]
          }));
          true;
        } catch(e) {
          console.error('Error in markers:', e);
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
              {city ? `${city} • ` : ''}Ljubljana • Maribor • Celje
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