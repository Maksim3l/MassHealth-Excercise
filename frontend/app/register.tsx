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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('')

    const OnRegisterPressed = () => {
      router.push('/tags')
    }

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
          placeholder='Full name'
          value={name}
          onChangeText={setName}
           />
           <Input
          placeholder='Email'
          value={email}
          onChangeText={setEmail}
           />
        <Input
          placeholder='Username'
          value={username}
          onChangeText={setUsername}
          secureTextEntry={true}
           />
        <Input
          placeholder='Passsword'
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
           />
        <Input
          placeholder='Passsword repeat'
          value={passwordRepeat}
          onChangeText={setPasswordRepeat}
          secureTextEntry={true}
           />
        <DefButton 
            onPress={OnRegisterPressed}
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
