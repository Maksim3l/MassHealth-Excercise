import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import BackIcon from '../../assets/tsxicons/backIcon'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/input'
import TagButton from '../../components/tag'
import ExerciseinRoutine from '../../components/exerciseinRoutine'
import DefButton from '../../components/button'

const EditRoutine = () => {
  const [RoutineName, setRoutineName] = useState('')

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.title}>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                    <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
                </TouchableOpacity>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.text}>Edit a routine</Text>
            </View>
             
        </View>

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Routine name</Text>
        </View>
        <Input
          value={RoutineName}
          onChangeText={setRoutineName}
          style={styles.inputContainer}
          ></Input>

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Workout type</Text>
        </View>
          <View style={styles.tagContainer}>
          <TagButton onPress={() => console.log("press")} text={"Lower body"} textSize='16' >
          </TagButton>
          <TagButton onPress={() => console.log("press")} text={"Upper body"} textSize='16' >
          </TagButton>
          <TagButton onPress={() => console.log("press")} text={"Cardio body"} textSize='16' >
          </TagButton>
          <TagButton onPress={() => console.log("press")} text={"Core training"} textSize='16' >
          </TagButton>
        </View>

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Workouts</Text>
        </View>
        <View style={styles.workoutsContainer}>
          <ExerciseinRoutine exerciseName="Calf Raise" reps={"3x10"} press={true}>

          </ExerciseinRoutine>
        </View>

        <View style={styles.continue}>
                <DefButton text="Create" onPress={() => console.log("workout started")} />
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
      marginHorizontal: 20

      
    },
    title: {
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10
    },
    textContainer: {
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingHorizontal: 10,
    },
    text: {
      fontSize: 32,
      color: "#6E49EB",
      fontWeight: '600',
    },
    subtitleContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      marginHorizontal: 20
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600'

    },
    inputContainer: {
      marginHorizontal: 20
    },
    tagContainer: {
      flexDirection: 'row',
      marginHorizontal: 15,
      marginVertical: 10,
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    workoutsContainer: {
      padding: 10,
    },
    continue: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
  
    },
  });
  

export default EditRoutine