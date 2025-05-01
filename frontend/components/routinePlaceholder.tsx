import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'

const RoutinePlaceholder = () => {
  return (
     <TouchableOpacity style={styles.button}>                             
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    button : {
        width: 130,
        height: 120,
        marginLeft: 20,
        borderRadius: 8,
        backgroundColor: 'grey'
    }
})

export default RoutinePlaceholder