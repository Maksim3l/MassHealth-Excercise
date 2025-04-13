import { View, Text, ImageBackground, StyleSheet, Pressable, TouchableOpacity } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

const entry = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/entryimage.jpg')}
        style={styles.imageBackground}
        resizeMode="cover">
        <LinearGradient
          style={styles.gradient}
          colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.8)"]}
        >
          <SafeAreaView style={styles.container2}>
            <Text style={styles.text}>Transform your body and mind</Text>

            <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
              <Text style={styles.buttonText}>Get started</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  container2: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  text: {
    color: 'white',
    fontSize: 40,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'left'
  },
  button: {
    backgroundColor: '#8a2be2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 23,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  }
});

export default entry