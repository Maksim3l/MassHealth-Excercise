import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Overlay } from 'react-native-elements'
import { SvgProps } from 'react-native-svg';
import PlayIcon from '../assets/tsxicons/playicon_';

interface RoutineButtonProps {
    routineName: string;
    playIcon?: boolean;
    id?: number;
    onPress: (routineName: string) => void;

}

const Routinebutton: React.FC<RoutineButtonProps> = ({routineName, playIcon, onPress}) => {
  return (
    
        <TouchableOpacity style={styles.button} onPress={() => onPress(routineName)}>
                <ImageBackground style={styles.background} source={require('./../assets/Intersect.png')} >
                    <View style={styles.overlay}></View>
                    <View style={styles.text}>
                        <Text style={styles.textTitle}>{routineName}</Text>
                    </View>
                    <View style={styles.buttonIcon}>
                        {playIcon ? <PlayIcon strokeColor={"white"} /> : null}
                    </View>



                </ImageBackground>
                
        </TouchableOpacity>
        

  )
}

const styles = StyleSheet.create({
    button: {
        width: 124,
        height: 124,
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
    },
    buttonIcon: {
        justifyContent: 'center',
        alignItems: 'center'
    }

})

export default Routinebutton