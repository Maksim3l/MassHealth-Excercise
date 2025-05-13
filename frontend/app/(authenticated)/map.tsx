import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Paho from 'paho-mqtt';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UserLocation {
  userId: string;
  username?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const DEFAULT_LOCATION = {
  latitude: 46.0569,
  longitude: 14.5058
};

// Update the HTML content to handle user location with labels
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
    .other-user-marker {
      border-radius: 50%;
      width: 10px;
      height: 10px;
      background-color: #FF5252;
      border: 2px solid white;
      box-shadow: 0 0 3px rgba(0,0,0,0.3);
    }
    .accuracy-circle {
      border-radius: 50%;
      background-color: rgba(66, 133, 244, 0.2);
      border: 1px solid rgba(66, 133, 244, 0.5);
    }
    .marker-label {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 10px;
      white-space: nowrap;
      text-align: center;
      transform: translateX(-50%);
      position: absolute;
      bottom: -18px;
      left: 50%;
    }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map');
    let markers = {};
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
          // Get array of userIds in the new payload
          const newUserIds = message.payload.map(m => m.userId || 'default');
          
          // Get array of existing userIds
          const existingUserIds = Object.keys(markers);
          
          // Remove markers not in new payload
          existingUserIds.forEach(id => {
            if (!newUserIds.includes(id)) {
              map.removeLayer(markers[id]);
              delete markers[id];
            }
          });
          
          // Add/update markers
          message.payload.forEach(markerData => {
            const userId = markerData.userId || 'default';
            const username = markerData.username || 'User';
            
            // Create icon for other users with label
            let markerIcon;
            if (markerData.icon) {
              markerIcon = L.divIcon({
                className: markerData.icon.className || 'other-user-marker',
                iconSize: markerData.icon.iconSize || [10, 10],
                iconAnchor: markerData.icon.iconAnchor || [5, 5],
                html: \`<div class="\${markerData.icon.className || 'other-user-marker'}"></div><div class="marker-label">\${username}</div>\`
              });
            }
            
            if (markers[userId]) {
              // Update existing marker
              markers[userId].setLatLng([markerData.lat, markerData.lng]);
              if (markerIcon) {
                markers[userId].setIcon(markerIcon);
              }
            } else {
              // Create new marker
              markers[userId] = L.marker([markerData.lat, markerData.lng], {
                icon: markerIcon
              }).addTo(map);
            }
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
            iconAnchor: [8, 8],
            html: '<div class="user-location-marker"></div><div class="marker-label">You</div>'
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
  const [otherUserLocations, setOtherUserLocations] = useState<UserLocation[]>([]);
  const [lastSeenTimes, setLastSeenTimes] = useState<{[userId: string]: number}>({});
  
  // Debug effect to check global variables
  useEffect(() => {
    console.log("Global variables check:", {
      userId: global.userId, 
      username: global.username,
      mqttConnected: global.mqttClient?.isConnected() 
    });
  }, []);
  
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
            distanceInterval: 70,     // Update if moved 70 meters
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
  
  // Publish location updates via MQTT
  useEffect(() => {
    const client = global.mqttClient;

    if (client && client.isConnected() && userLocation) {
      try {
        // Use a fallback if username is undefined
        const safeUsername = global.username || `user-${global.userId?.substring(0, 8)}` || 'anonymous';
        
        const locationMessage = {
          userId: global.userId,
          username: safeUsername,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          timestamp: new Date().toISOString(),
          accuracy: userLocation.accuracy
        };

        // Use a topic structure that includes the user ID
        const topic = `users/${global.userId}/location`;
        
        const message = new Paho.Message(JSON.stringify(locationMessage));
        message.destinationName = topic;
        message.qos = 0;
        message.retained = true; // Important: retain the message

        client.send(message);
        console.log('Location published to:', topic);
      } catch(error) {
        console.error('Error publishing location via MQTT', error);
      }
    } else {
      console.log("Cannot publish location - MQTT conditions not met:", {
        clientExists: !!client,
        isConnected: client?.isConnected(),
        hasLocation: !!userLocation
      });
    }
  }, [userLocation]);

  // Handle incoming MQTT messages
  useEffect(() => {
    const client = global.mqttClient;

    if(client && client.isConnected()) {
      try {
        // Subscribe to all user location topics
        client.subscribe('users/+/location', { qos: 0 });
        console.log('Subscribed to all user locations with wildcard');

        // Create message handler
        const messageHandler = (message: Paho.Message) => {
          try {
            console.log("MQTT message received:", message.destinationName, message.payloadString);
            const topicParts = message.destinationName.split('/');
            
            // Make sure this is a location message
            if (topicParts[0] === 'users' && topicParts[2] === 'location') {
              const userId = topicParts[1];
              const locationData = JSON.parse(message.payloadString);
              
              // Skip our own messages
              if(userId !== global.userId) {
                const username = locationData.username || 'Unknown User';
                
                // Update last seen time for this user
                setLastSeenTimes(prev => ({
                  ...prev,
                  [userId]: new Date().getTime()
                }));
                
                setOtherUserLocations(prevLocations => {
                  const existingIndex = prevLocations.findIndex(
                    loc => loc.userId === userId
                  );
                  
                  if (existingIndex !== -1) {
                    // Update existing user's location
                    const updatedLocations = [...prevLocations];
                    updatedLocations[existingIndex] = {
                      userId,
                      username,
                      latitude: locationData.latitude,
                      longitude: locationData.longitude,
                      timestamp: locationData.timestamp || new Date().toISOString()
                    };
                    return updatedLocations;
                  } else {
                    // Add new user location
                    return [...prevLocations, {
                      userId,
                      username,
                      latitude: locationData.latitude,
                      longitude: locationData.longitude,
                      timestamp: locationData.timestamp || new Date().toISOString()
                    }];
                  }
                });
              }
            }
          } catch(e) {
            console.error('Error processing MQTT message:', e, message.payloadString);
          }
        };
        
        // Set the message handler
        client.onMessageArrived = messageHandler;
      } catch(error) {
        console.error('Error setting up MQTT message handler:', error);
      }
    } else {
      console.log("Cannot subscribe - MQTT client not ready:", {
        clientExists: !!client,
        isConnected: client?.isConnected()
      });
    }

    return () => {
      if(client && client.isConnected()) {
        client.unsubscribe('users/+/location');
        console.log('Unsubscribed from user locations');
      }
    };
  }, []);

  // Clean up stale user data
  useEffect(() => {
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Set up interval to check for stale data
    const interval = setInterval(() => {
      const now = new Date().getTime();
      
      setOtherUserLocations(prevLocations => {
        return prevLocations.filter(location => {
          const lastSeen = lastSeenTimes[location.userId] || 0;
          return (now - lastSeen) < STALE_THRESHOLD;
        });
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [lastSeenTimes]);
  
  // Update user location on map
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
  
  // Update other users' markers when locations change
  useEffect(() => {
    if (webViewRef.current && otherUserLocations.length > 0) {
      // Format markers data for all other users
      const markersData = otherUserLocations.map(user => ({
        lat: user.latitude,
        lng: user.longitude,
        userId: user.userId,
        username: user.username || 'User',
        icon: {
          className: 'other-user-marker',
          iconSize: [15, 15],
          iconAnchor: [7, 7]
        }
      }));
      
      console.log("Updating map with user markers:", markersData.length);
      
      // Inject markers to map
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'markers',
            payload: ${JSON.stringify(markersData)}
          }));
          true;
        } catch(e) {
          console.error('Error in updating user markers:', e);
          true;
        }
      `);
    }
  }, [otherUserLocations]);
  
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
      
      // Add other user markers if any exist
      if (otherUserLocations.length > 0) {
        const markersData = otherUserLocations.map(user => ({
          lat: user.latitude,
          lng: user.longitude,
          userId: user.userId,
          username: user.username || 'User',
          icon: {
            className: 'other-user-marker',
            iconSize: [15, 15],
            iconAnchor: [7, 7]
          }
        }));
    
        webViewRef.current.injectJavaScript(`
          try {
            window.postMessage(JSON.stringify({
              type: 'markers',
              payload: ${JSON.stringify(markersData)}
            }));
            true;
          } catch(e) {
            console.error('Error in updating user markers:', e);
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
        
        {otherUserLocations.length > 0 && (
          <View style={styles.usersOnlineContainer}>
            <Text style={styles.usersOnlineText}>
              {otherUserLocations.length} user{otherUserLocations.length !== 1 ? 's' : ''} online
            </Text>
          </View>
        )}
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
  },
  usersOnlineContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  usersOnlineText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  }
});

export default Map;