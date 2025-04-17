import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleButton from '../components/googlebutton';
import Input from '../components/input';
import DefButton from '../components/button';
import { router } from 'expo-router';

const Register = () => {

    const [name, setName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container2}>
            <Text style={styles.title}>
                Register
            </Text>
            <GoogleButton 
            onPress={() => console.log('Google pressed')} 
            text="Sign Up with Google"
          />
           <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
            <View style={{flex: 1, height: 1, backgroundColor: 'black',}} />
            <View>
            <Text style={{width: 50, textAlign: 'center'}}>Ali</Text>
            </View>
            <View style={{flex: 1, height: 1, backgroundColor: 'black', margin: 10}} />
          </View>
          <Input
          placeholder='Name'
          value={name}
          onChangeText={setName}
           />
           <Input
          placeholder='Last Name'
          value={lastName}
          onChangeText={setLastName}
           />
        <Input
          placeholder='Username'
          value={username}
          onChangeText={setUsername}
           />
        <Input
          placeholder='Passsword'
          value={password}
          onChangeText={setPassword}
           />
        <DefButton 
            onPress={() => console.log("Button pressed")}
            text="Register"
            />
        <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Already have an account!? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.registerLink}>Log in!</Text>
            </TouchableOpacity>
          </View>
            </View>
      </SafeAreaView>
      </View>

  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    title: {
        fontSize: 40,
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

export default Register