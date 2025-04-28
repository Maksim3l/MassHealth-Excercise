import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'

interface ButtonProps  {
    onPress: () => void;
    text: string;
}

export default function DefButton({ onPress, text }: ButtonProps){
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{text}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 15
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
      },
      button: {
        backgroundColor: '#6E49EB',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
      },

})

