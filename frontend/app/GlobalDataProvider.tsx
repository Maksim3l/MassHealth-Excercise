import React, { useEffect } from 'react';
import { View } from 'react-native';
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
          
          // Check if MQTT is already connected
          if (!global.mqttClient || !global.mqttClient.isConnected()) {
            reconnectMQTT(userId, username);
          } else {
            console.log('MQTT already connected, skipping reconnect');
          }
        }
      } catch (error) {
        console.error('Error restoring user data', error);
      }
    };
    
    restoreUserData();
  }, []);
  
  // Function to reconnect to MQTT if needed
  const reconnectMQTT = (userId: string, username: string) => {
    // First ensure we don't already have a connection
    if (global.mqttClient && global.mqttClient.isConnected()) {
      console.log('MQTT already connected, disconnecting first');
      try {
        global.mqttClient.disconnect();
      } catch (error) {
        console.error('Error disconnecting existing MQTT client:', error);
      }
    }
    
    try {
      // Create a unique client ID with timestamp to prevent duplicates
      const timestamp = new Date().getTime();
      const clientId = `user_${userId}_${timestamp}_${Math.random().toString(16).substr(2, 8)}`;
      console.log('Creating new MQTT client with ID:', clientId);
      
      const client = new Paho.Client('192.168.1.124', 9001, clientId);
      
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
          
          client.subscribe('users/+/location', { qos: 0 });
          
          // Publish presence message
          const connectMessage = {
            userId: userId,
            username: username,
            status: 'online',
            timestamp: new Date().toISOString()
          };
          
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
  
  return <>{children}</>;
};

export default GlobalDataProvider;






















