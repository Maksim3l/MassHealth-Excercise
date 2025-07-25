import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'

import { GestureResponderEvent } from 'react-native';

interface CreateRoutineProps {
  onPress: () => void;
}

const CreateRoutineButton: React.FC<CreateRoutineProps> = ({onPress}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>+</Text>
        <Text style={styles.text}>Create</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    button: {
        width: 130,
        height: 120,
        padding: 20,
        marginLeft: 20,
        backgroundColor: '#FEFFFE',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#A4A4A8',

    },
    text: {
        color: '#A4A4A8',
        fontWeight: '700',
        fontSize: 16
    }
})

export default CreateRoutineButton