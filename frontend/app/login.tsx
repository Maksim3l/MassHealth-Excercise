import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'; 
import { router } from 'expo-router'; 
import React, { useState, useEffect } from 'react'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleButton from '../components/googlebutton';
import Input from '../components/input';
import DefButton from '../components/button';
import { supabase } from '../utils/supabase';
import * as Paho from 'paho-mqtt';

const MQTT_HOST = '192.168.1.14'; // Update actual broker address
const MQTT_PORT = 9001;

const login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true) // Start with loading true to check session
  const [showReset, setShowReset] = useState(false)
  const [mqttClient, setMqttClient] = useState<Paho.Client | null>(null)

  useEffect(() => {
    checkExistingSession();
  }, [])

  useEffect(() => {
    return () => {
      disconnectMQTT();
    }
  }, [mqttClient])

  // Function to handle MQTT disconnection
  const disconnectMQTT = () => {
    if(mqttClient && mqttClient.isConnected()) {
      try {
        // Send offline status before disconnecting
        if (global.userId) {
          const offlineMessage = {
            userId: global.userId,
            username: global.username || 'anonymous',
            status: 'offline',
            timestamp: new Date().toISOString()
          };
          
          const presenceMessage = new Paho.Message(JSON.stringify(offlineMessage));
          presenceMessage.destinationName = `users/${global.userId}/presence`;
          presenceMessage.qos = 0;
          presenceMessage.retained = true;
          
          mqttClient.send(presenceMessage);
          console.log('Published offline presence message');
        }
        
        mqttClient.disconnect();
        console.log('Disconnected from MQTT broker');
        global.mqttClient = null;
      } catch(e) {
        console.error("Error disconnecting MQTT:", e);
        global.mqttClient = null;
      }
    }
  }

  // Function to connect to MQTT
  const connectToMQTT = (userId: string, username: string) => {
    if (global.mqttClient && global.mqttClient.isConnected()) {
      console.log('Disconnecting existing MQTT client before login');
      try {
        global.mqttClient.disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting existing client:', disconnectError);
      }
      global.mqttClient = null;
    }

    try {
      // Create a unique client ID with timestamp to prevent duplicates
      const timestamp = new Date().getTime();
      const clientId = `user_${userId}_${timestamp}_${Math.random().toString(16).substr(2, 8)}`;
      console.log('Creating new MQTT client with ID:', clientId);
      
      const client = new Paho.Client(MQTT_HOST, MQTT_PORT, clientId);
      
      client.onConnectionLost = (responseObject: Paho.MQTTError) => {
        if (responseObject.errorCode !== 0) {
          console.log("Connection lost:", responseObject.errorMessage);
        }
      };
      
      client.onMessageArrived = (message: Paho.Message) => {
        console.log("Message received:", message.destinationName, message.payloadString);
      };
      
      // Connect to the broker
      client.connect({
        onSuccess: () => {
          console.log("Connected to MQTT broker with client ID:", clientId);
          setMqttClient(client);
          global.mqttClient = client;
          
          // Subscribe to all user location topics
          client.subscribe('users/+/location', { qos: 0 });
          console.log('Subscribed to all user locations');
          
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
          console.log('Published presence message');
        },
        onFailure: (err: any) => {
          console.error("MQTT connection failed:", err);
        },
        useSSL: false // Change to true if using SSL
      });
      
      return client;
    } catch (error) {
      console.error("MQTT setup error:", error);
      return null;
    }
  };

  async function checkExistingSession() {
    try {
      //console.log("Checking for existing session...")
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Error checking session:", error)
        setLoading(false)
        return
      }
      
      if (data?.session) {
        // Verify session is valid and not expired
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = data.session.expires_at
        
        if (expiresAt && expiresAt > now) {
          //console.log("Found valid existing session, redirecting to authenticated route")
          
          // Get username for MQTT connection
          const username = await AsyncStorage.getItem('username') || `user-${data.session.user.id.substring(0, 8)}`;
          global.username = username;
          global.userId = data.session.user.id;
          
          if (!global.mqttClient || !global.mqttClient.isConnected()) {
            const client = connectToMQTT(data.session.user.id, username);
            if (client) {
              setMqttClient(client);
            }
          }
          
          router.replace('/(authenticated)/(tabs)/home')
          return // Keep loading true while redirecting
        } else {
          console.log("Found expired session, will need to log in again")
          // Clear the expired session
          await prepareForLogin()
        }
      } else {
        //console.log("No active session found, user needs to log in")
      }
      
      setLoading(false) // Only set loading to false if we're not redirecting
    } catch (err) {
      console.error("Error checking session:", err)
      setLoading(false)
    }
  }

  // Function to prepare for a clean login attempt 
  async function prepareForLogin() {
    try {
      //console.log("Signing out and clearing tokens...")
      
      // Sign out first
      await supabase.auth.signOut({ scope: 'global' })
      
      await AsyncStorage.removeItem('supabase.auth.token')
      await AsyncStorage.removeItem('supabase.auth.refreshToken')
      
      disconnectMQTT();
      
      //console.log("Session cleared successfully")
    } catch (err) {
      console.error("Error preparing for login:", err)
    }
  }

  // Password-based sign in with error handling
  async function signInWithEmail() {
    setLoading(true)
    try {
      console.log("Attempting login with:", { email })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })
      
      console.log("Auth response:", { 
        hasSession: !!data?.session, 
        hasUser: !!data?.user,
        error: error ? error.message : null
      })
      
      if (error) {
        console.error("Login error:", error)
        
        // Check for duplicate token error
        if (error.message.includes('Database error granting user') || 
            error.message.includes('duplicate key value')) {
          
          //console.log("Detected token conflict error")
          setShowReset(true)
          
          Alert.alert(
            "Session Error", 
            "There was an issue with your previous session. Would you like to reset it and try again?",
            [
              { 
                text: "Reset & Try Again", 
                onPress: handleResetTokens 
              },
              { 
                text: "Try Magic Link Instead", 
                onPress: sendMagicLink 
              },
              { text: "Cancel" }
            ]
          )
          return
        }
        
        // Handle other errors
        Alert.alert("Login Error", error.message)
        return
      }
      
      console.log("Login successful!")

      // Fetch and set username
      try {
        const { data: userData, error: usernameError } = await supabase
        .from('User_Metadata')
        .select('username')
        .eq('user_id', data.user.id)
        .single();
          
        let safeUsername;
        if (usernameError) {
          console.error("Error fetching username:", usernameError.message);
          // Create a fallback username based on user ID
          safeUsername = `user-${data.user.id.substring(0, 8)}`;
        } else {
          // Successfully fetched username
          safeUsername = userData?.username || `user-${data.user.id.substring(0, 8)}`;
        }
        
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('userId', data.user.id);
        await AsyncStorage.setItem('username', safeUsername);
        
        global.username = safeUsername;
        global.userId = data.user.id;
        
        console.log("Set and persisted username:", safeUsername);
      } catch (err) {
        console.error("Unexpected error handling user data:", err);
        const safeUsername = `user-${data.user.id.substring(0, 8)}`;
        global.username = safeUsername;
        global.userId = data.user.id;
        
        // Still try to persist even in error case
        try {
          await AsyncStorage.setItem('userId', data.user.id);
          await AsyncStorage.setItem('username', safeUsername);
        } catch (storageError) {
          console.error("Error storing user data:", storageError);
        }
      }
      
      // Connect to MQTT
      const client = connectToMQTT(data.user.id, global.username || `user-${data.user.id.substring(0, 8)}`);
      if (client) {
        setMqttClient(client);
      }
      
      router.replace('/(authenticated)/(tabs)/home');
    } catch (error) {
      console.error("Exception during login:", error);
      Alert.alert('Login error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Magic link login as an alternative
  async function sendMagicLink() {
    if (!email) {
      Alert.alert("Email Required", "Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Sending magic link to:", email);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email
      });
      
      if (error) {
        console.error("Magic link error:", error);
        Alert.alert("Error", error.message);
        return;
      }
      
      Alert.alert(
        "Check Your Email", 
        `We've sent a login link to ${email}. Click it to sign in.`
      );
    } catch (err) {
      console.error("Exception sending magic link:", err);
      Alert.alert("Error", "Failed to send login link");
    } finally {
      setLoading(false);
    }
  }

  // Handle token reset for when we hit token conflicts
  async function handleResetTokens() {
    setLoading(true);
    try {
      console.log("Attempting to reset user tokens...");
      
      // Clear the session since we need to reset
      await prepareForLogin();
      
      // Try login again
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error("Login still failed after reset:", error);
        
        // Fall back to magic link
        Alert.alert(
          "Still Having Issues", 
          "We're still having trouble with your login. Would you like to try logging in with a magic link instead?",
          [
            { text: "Use Magic Link", onPress: sendMagicLink },
            { text: "Cancel" }
          ]
        );
        return;
      }
      
      const safeUsername = `user-${data.user.id.substring(0, 8)}`;
      global.username = safeUsername;
      global.userId = data.user.id;
      
      await AsyncStorage.setItem('userId', data.user.id);
      await AsyncStorage.setItem('username', safeUsername);
      
      // Connect to MQTT
      const client = connectToMQTT(data.user.id, safeUsername);
      if (client) {
        setMqttClient(client);
      }
      
      console.log("Login successful after token reset!");
      router.replace('/(authenticated)/(tabs)/home');
      
    } catch (err) {
      console.error("Error during token reset:", err);
      Alert.alert("Error", "Failed to reset your session. Please try the magic link option.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !email && !password) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container2, styles.loadingContainer]}>
          <Text style={styles.loadingText}>Checking login status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container2}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.h2}>Log into your MassHealth Account</Text>

        <GoogleButton 
          onPress={() => console.log('Google login pressed')} 
          text="Sign in with Google"
        />
        
        <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
          <View style={{flex: 1, height: 1, backgroundColor: 'black',}} />
          <View>
            <Text style={{width: 50, textAlign: 'center'}}>Ali</Text>
          </View>
          <View style={{flex: 1, height: 1, backgroundColor: 'black', margin: 10}} />
        </View>
        
        <Input
          placeholder='Email'
          inputMode='email'
          value={email}
          onChangeText={setEmail}
        />
        
        <Input
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
        
        <DefButton
          onPress={() => signInWithEmail()}
          text="Log in!"
        />
        
        {showReset && (
          <DefButton
            onPress={sendMagicLink}
            text="Login with Email Link"
          />
        )}
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Not registered yet!? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: '600'
  },
  h2: {
    fontSize: 25,
    opacity: 0.6,
  },
  container2: {
    marginTop: '20%',
    marginBottom: '20%',
    paddingHorizontal: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#8a2be2',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  registerText: {
    fontSize: 14,
    color: '#555',
  },
  registerLink: {
    fontSize: 14,
    color: '#8a2be2',
    fontWeight: '500'
  }
});

export default login;