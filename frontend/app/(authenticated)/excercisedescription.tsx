import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackIcon from '../../assets/tsxicons/backIcon'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'



const ExcercisePreview= () => {

  const { exerciseName, reps, time } = useLocalSearchParams();


  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.title}>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                    <BackIcon stroke={"#6E49EB"} height ={24} width={24}/>
                </TouchableOpacity>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.text}>{exerciseName}</Text>
            </View>        
        </View>
        <View style={styles.imageContainer}>
          <Image style={styles.image}
          source={require('../../assets/workoutPlaceholder.png')} ></Image>
        </View>
        <View style={styles.descriptionContainer}>
        <Text style={styles.description}>Instructions</Text>
        <Text style={styles.describe}> Set barbell on power rack upper chest height with calf block under barbell. Position back of shoulders under barbell with both hands to sides. Position toes and balls of feet on calf block with arches and heels extending off. Lean barbell against rack and raise from supports by extending knees and hips. Support barbell against verticals with both hands to sides.
          Raise heels by extending ankles as high as possible. Lower heels by bending ankles until calves are stretched. Repeat.</Text>
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  title: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 32,
    color: "#6E49EB",
    fontWeight: '600',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    marginHorizontal: 20,           
    width: 300,          
    resizeMode: 'contain' 
  },
  descriptionContainer: {
    marginHorizontal: 20,
    padding: 20,
  },
  description: {
    fontSize: 24,
    fontWeight: '600'
  },
  describe: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'justify'
    

  }
})


export default ExcercisePreview