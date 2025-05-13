import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Paho from 'paho-mqtt';

const GlobalDataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize and restore global data
  useEffect(() => {
    const restoreUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const username = await AsyncStorage.getItem('username');
        
        if (userId && username) {
          global.userId = userId;
          global.username = username;
          
          console.log('Restored user data:', { userId, username });
          
          // Optionally reconnect to MQTT if needed
          reconnectMQTT(userId, username);
        }
      } catch (error) {
        console.error('Error restoring user data', error);
      }
    };
    
    restoreUserData();
  }, []);
  
  // Function to reconnect to MQTT if needed
  const reconnectMQTT = (userId: string, username: string) => {
    // Only reconnect if we're not already connected
    if (global.mqttClient && global.mqttClient.isConnected()) {
      console.log('MQTT already connected');
      return;
    }
    
    try {
      // Create a unique client ID
      const clientId = `user_${userId}_${Math.random().toString(16).substr(2, 8)}`;
      const client = new Paho.Client('192.168.1.45', 9001, clientId);
      
      // Set up callbacks
      client.onConnectionLost = (responseObject: Paho.MQTTError) => {
        if (responseObject.errorCode !== 0) {
          console.log("Connection lost:", responseObject.errorMessage);
        }
      };
      
      // Connect to the broker
      client.connect({
        onSuccess: () => {
          console.log("Reconnected to MQTT broker with client ID:", clientId);
          global.mqttClient = client;
          
          // Subscribe to all user location topics
          client.subscribe('users/+/location', { qos: 0 });
          
          // Publish presence message
          const connectMessage = {
            userId: userId,
            username: username,
            status: 'online',
            timestamp: new Date().toISOString()
          };
          
          // Create and send presence message with retained flag
          const presenceMessage = new Paho.Message(JSON.stringify(connectMessage));
          presenceMessage.destinationName = `users/${userId}/presence`;
          presenceMessage.qos = 0;
          presenceMessage.retained = true;
          
          client.send(presenceMessage);
          console.log('Published presence message on reconnect');
        },
        onFailure: (err) => {
          console.error("MQTT reconnection failed:", err);
        },
        useSSL: false // Change to true if using SSL
      });
    } catch (error) {
      console.error("Error setting up MQTT reconnection:", error);
    }
  };
  
  // Just render children, no UI for this component
  return <>{children}</>;
};

export default GlobalDataProvider;