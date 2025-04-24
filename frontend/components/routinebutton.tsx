import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Overlay } from 'react-native-elements'

interface RoutineButtonProps {
    routineName?: string;

}

const Routinebutton: React.FC<RoutineButtonProps> = ({routineName}) => {
  return (
    
        <TouchableOpacity style={styles.button}>
                <ImageBackground style={styles.background} source={require('./../assets/Intersect.png')} >
                    <View style={styles.overlay}></View>
                    <View style={styles.text}>
                        <Text style={styles.textTitle}>{routineName}</Text>
                    </View>
                </ImageBackground>
                
        </TouchableOpacity>
        

  )
}

const styles = StyleSheet.create({
    button: {
        width: 130,
        height: 120,
        marginLeft: 20,
        borderRadius: 8,
        overflow: 'hidden'
    },
    text: {
        alignItems  : 'center',
        padding: 10,
    },
    textTitle: {
        fontWeight: '600',
        color: 'white',
        fontSize: 16

    },
    background: {
        flex: 3,
        resizeMode: 'cover',
        width: '100%',
        backgroundColor: '#6E49EB',
        height: '100%'
    },
    overlay: {
        opacity: 0.5,
        height: "100%",
        width: "100%",
        position: 'absolute',
        backgroundColor: '#6E49EB',
    }
})

export default Routinebutton