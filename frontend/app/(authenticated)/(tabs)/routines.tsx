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
import * as Paho from 'paho-mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../utils/supabase';
import { useFocusEffect } from 'expo-router'; // Update this import

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
    .other-user-marker {
      border-radius: 50%;
      width: 10px;
      height: 10px;
      background-color: #FF5252;
      border: 2px solid white;
      box-shadow: 0 0 3px rgba(0,0,0,0.3);
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
    // Change markers from array to object to track by userId
    let markers = {};
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
            const username = markerData.username || 'Unknown';
            
            // Create icon for other users
            let markerIcon;
            if (markerData.icon) {
              markerIcon = L.divIcon({
                className: markerData.icon.className || 'other-user-marker',
                iconSize: markerData.icon.iconSize || [10, 10],
                iconAnchor: markerData.icon.iconAnchor || [5, 5],
                html: \`<div class="marker-icon"></div><div class="marker-label">\${username}</div>\`              });
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

const fetchRoutines = async (setUserRoutines: any, setLoadingRoutines: any) => {
  try {
    setLoadingRoutines(true);
    const { data, error } = await supabase
      .from('Routine')
      .select('id, name')
    
    if (error) {
      console.error('Error fetching routines:', error);
      return;
    }
    
    setUserRoutines(data || []);
  } catch (error) {
    console.error('Unexpected error in fetchRoutines:', error);
  } finally {
    setLoadingRoutines(false);
  }
};



const Routines: React.FC = () => {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [userRoutines, setUserRoutines] = useState<Array<{id: number, name: string}>>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [userLocation, setUserLocation] = useState({
    latitude: 46.0569,  // Default to Ljubljana
    longitude: 14.5058
  });
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  // Add readyToPublish state to track when all conditions are met
  const [readyToPublish, setReadyToPublish] = useState(false);


  const fetchFriends = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
  
      if (!currentUser?.user?.id) {
        throw new Error('Not authenticated');
      }
  
      // Get all accepted connections where this user is either sender or receiver
      const { data: sentConnections, error: sentError } = await supabase
        .from('friend_connections')
        .select('receiver_id')
        .eq('sender_id', currentUser.user.id)
        .eq('status', 'accepted');
        
      if (sentError) throw sentError;
      
      const { data: receivedConnections, error: receivedError } = await supabase
        .from('friend_connections')
        .select('sender_id')
        .eq('receiver_id', currentUser.user.id)
        .eq('status', 'accepted');
        
      if (receivedError) throw receivedError;
      
      // Extract friend IDs
      const sentFriendIds = sentConnections.map(conn => conn.receiver_id);
      const receivedFriendIds = receivedConnections.map(conn => conn.sender_id);
      
      // Combine both arrays and store in state
      setFriendIds([...sentFriendIds, ...receivedFriendIds]);
      console.log('Fetched friend IDs:', [...sentFriendIds, ...receivedFriendIds]);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };
  
  
  // Fixed locations
  const locations = [
    { latitude: 46.0569, longitude: 14.5058 }, // Ljubljana
    { latitude: 46.2382, longitude: 14.3555 }, // Kranj
    { latitude: 45.5475, longitude: 13.7304 }  // Koper
  ];

  const restoreUserData = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const username = await AsyncStorage.getItem('username');
    
    if (userId) global.userId = userId;
    if (username) global.username = username;
    
    console.log('Restored user data:', { userId, username });
  } catch (error) {
    console.error('Error restoring user data', error);
  }
};

  // State for tracking other users' locations
  const [otherUserLocations, setOtherUserLocations] = useState<Array<{
    userId: string,
    username?: string,
    latitude: number,
    longitude: number,
    timestamp: string
  }>>([]);
  
  // State for tracking when we last saw each user
  const [lastSeenTimes, setLastSeenTimes] = useState<{[userId: string]: number}>({});
  
  // Debug effect to check global variables
  useEffect(() => {
    console.log("Global variables check:", {
      mqttConnected: global.mqttClient?.isConnected() 
    });
    restoreUserData();
  }, []);

  useEffect(() => {
    fetchFriends();
  }, []);
  
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
          
          setIsLoading(false); // Mark loading as complete here after we have data
        }
        
        // Start watching position updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 300000,    // Update every 5 minutes
            distanceInterval: 70,    // Update if moved 70 meters 
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
        if (isMounted) {
          setIsLoading(false); // Ensure loading state is updated even on error
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

  // Check if we're ready to publish location data
  useEffect(() => {
    // Verify all conditions are met before setting ready
    if (
      global.mqttClient && 
      global.mqttClient.isConnected() && 
      userLocation && 
      !isLoading && 
      global.userId
    ) {
      console.log("All conditions for publishing are met");
      setReadyToPublish(true);
    } else {
      setReadyToPublish(false);
    }
  }, [userLocation, isLoading]);
  
  // Publish location updates via MQTT - only when ready
  useEffect(() => {
    // Only attempt to publish when readyToPublish is true
    if (!readyToPublish) return;
    
    const client = global.mqttClient;
    
    try {
      const safeUsername = global.username || `user-${global.userId?.substring(0, 8)}` || 'anonymous';
      
      const locationMessage = {
        userId: global.userId,
        username: safeUsername,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: new Date().toISOString()
      };

      // Use a topic structure that includes the user ID
      const topic = `users/${global.userId}/location`;
      
      const message = new Paho.Message(JSON.stringify(locationMessage));
      message.destinationName = topic;
      message.qos = 0;
      message.retained = true; // Important: retain the message

      client?.send(message);
      console.log('Location published successfully to:', topic);
    } catch(error) {
      console.error('Error publishing location via MQTT', error);
    }
  }, [readyToPublish, userLocation]);
  
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
              center: true,
              zoom: 13
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

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutines(setUserRoutines, setLoadingRoutines);
    }, [])
  );

  // Handle incoming MQTT messages
  useEffect(() => {
    const client = global.mqttClient;
  
    if(client && client.isConnected()) {
      try {
        // Subscribe to all user location topics
        client.subscribe('users/+/location', { qos: 0 });
        console.log('Subscribed to all user locations with wildcard');
  
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
                
                // Only process messages from friends
                if (friendIds.includes(userId)) {
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
                } else {
                  console.log(`Filtering out non-friend user: ${userId}`);
                }
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
  }, [friendIds]); // Add friendIds as a dependency

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
    }, 18000); // Check every 3 minutes
    
    return () => clearInterval(interval);
  }, [lastSeenTimes]);

  // Update map markers when other users' locations change
  useEffect(() => {
    //console.log("otherUserLocations changed:", otherUserLocations);
    
    if (webViewRef.current && !isLoading && otherUserLocations.length > 0) {
      // Format markers data for all other users
      const markersData = otherUserLocations.map(user => ({
        lat: user.latitude,
        lng: user.longitude,
        userId: user.userId,
        username: user.username || 'User',
        // custom marker for other users
        icon: {
          className: 'other-user-marker',
          iconSize: [15, 15],
          iconAnchor: [7, 7]
        }
      }));
      
      //console.log("Updating map with markers:", markersData);
      
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
  }, [otherUserLocations, isLoading]);
  
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
      
      // Add markers for fixed locations
      webViewRef.current.injectJavaScript(`
        try {
          window.postMessage(JSON.stringify({
            type: 'markers',
            payload: [
              { lat: 46.0569, lng: 14.5058, userId: 'location-1' },
              { lat: 46.2382, lng: 14.3555, userId: 'location-2' },
              { lat: 45.5475, lng: 13.7304, userId: 'location-3' }
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

      // Add other user markers if any exist
      if (otherUserLocations.length > 0) {
        const markersData = otherUserLocations.map(user => ({
          lat: user.latitude,
          lng: user.longitude,
          userId: user.userId,
          icon: {
            className: 'other-user-marker',
            iconSize: [10, 10],
            iconAnchor: [5, 5]
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
          {/* map view */}
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
          
          {/* Overlay with location text and user count */}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapLocationText}>
              {otherUserLocations.length > 0 ? ` • ${otherUserLocations.length} other users online` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        
        <SectionTitle textOne='Your' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <CreateRoutineButton onPress={() => router.push('../createroutine')}/>
             {loadingRoutines ? (
              <Text style={styles.loadingText}>Loading routines...</Text>
            ) : userRoutines.length > 0 ? (
              // Map through your routines and render a button for each
              userRoutines.map((routine) => (
                <Routinebutton 
                  key={routine.id}
                  routineName={routine.name} 
                  onPress={() => navigateToPreview(routine.name)} 
                />
              ))
            ) : (
              // placeholder if no routines are found
              <RoutinePlaceholder />
            )}
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
  },
  loadingText: {
  padding: 10,
  color: '#888',
  }
});

export default Routines;