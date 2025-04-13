import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'

// Change to PascalCase and accept onPress as a prop
export default function GoogleButton({ onPress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={onPress}
      >
        <Image source={require('../assets/googlelogo.png')}
        style={styles.icon}
        >

        </Image>
        <Text style={styles.text}>
          Sign in with Google
        </Text>
      </TouchableOpacity>

      
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 15
    },
    button: {
        height: 60,
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        color: 'black',
        fontSize: 24,
        fontWeight: '600'
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 12,
    }
})