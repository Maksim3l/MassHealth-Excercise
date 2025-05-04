import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleButton from '../components/googlebutton';
import Input from '../components/input';
import DefButton from '../components/button';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase'

const Register = () => {

    const [name, setName] = useState('')
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('')
    const [loading, setLoading] = useState(false)

    const OnRegisterPressed = () => {
      signUpWithEmail();
    }

    async function signUpWithEmail() {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      
      if (error) {
        Alert.alert(error.message);
        setLoading(false);
        return;
      }
      
      if (data.user) {
        const { error: metaDataError } = await supabase
          .from('User_Metadata')
          .insert([{
            user_id: data.user.id,
            name: name,
            username: username,
            lastname: '',
            age: null,
            gender: '',
            height: null,
            weight: null,
            fitness_experience: null
          }]);
      
        if (metaDataError) {
          Alert.alert('Error saving data', metaDataError.message);
        } else {
          router.push('/(authenticated)/tags');
        }
      }
      
      setLoading(false);
      
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
