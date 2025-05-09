


import { View, Text, StyleSheet, Button, TouchableOpacity, Alert } from 'react-native'
import { router, Router } from 'expo-router'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleButton from '../components/googlebutton';
import Input from '../components/input';
import DefButton from '../components/button';
import { supabase } from '../utils/supabase';



const login = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)

  async function signInWIthEmail() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
  
      if (error) {
        Alert.alert(error.message);
        return; 
      }
      
      router.replace('/(authenticated)/(tabs)/home');
      
    } catch (error) {
      Alert.alert('Login error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
           >
        </Input>
        <Input
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
           >
        </Input>
        <DefButton
            onPress={() => signInWIthEmail()}
            text="Log in!"  />
        <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Not registered yet!? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  )
}

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

export default login
