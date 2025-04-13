import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleButton from '../components/googlebutton';

const login = () => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container2}>
          <Text style={styles.title}>Prijava</Text>
          <Text style={styles.h2}>Prijavite se v vaš MassHealth račun</Text>

          <GoogleButton 
            onPress={() => console.log('Google login pressed')} 
          />
          <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
        <View style={{flex: 1, height: 1, backgroundColor: 'black',}} />
        <View>
        <Text style={{width: 50, textAlign: 'center'}}>Ali</Text>
        </View>
        <View style={{flex: 1, height: 1, backgroundColor: 'black', margin: 10}} />
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
    }
});

export default login