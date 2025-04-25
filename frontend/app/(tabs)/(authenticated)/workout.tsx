import { View, Text, SafeAreaView, StyleSheet } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native';
import  WorkoutIcon  from '../../../assets/workoutnavbaricon'
import SectionTitle from '../../../components/sectiontitle';
import Routinebutton from '../../../components/routinebutton';
import RoutinePlaceholder from '../../../components/routinePlaceholder';
import { LegendList } from '@legendapp/list';

const routines = [
  { id: '1', name: 'Back day' },
  { id: '2', name: 'Leg day' },
  { id: '3', name: 'Chest day' },
  { id: '4', name: 'Arm day' },
  { id: '5', name: 'Core day' },
  { id: '6', name: 'Cardio day' },
  { id: '7', name: 'Shoulder day' },

];

const Workout = () => {
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.sectionTitle}>
          <WorkoutIcon color={"#6E49EB"} fill={"white"} />
          <Text style={styles.sectionTitleText}>Workout</Text>
        </View>

        <SectionTitle textOne='Your' textTwo='Workouts' />
        <View style={styles.buttonGroup}>
          <LegendList
            data={routines.slice(0, 3)} 
            estimatedItemSize={124}
            horizontal={true}
            recycleItems
            alignItemsAtEnd
            maintainScrollAtEnd
            maintainScrollAtEndThreshold={0.1}
            renderItem={({ item }) => (
              <Routinebutton routineName={item.name} playIcon={true} />
              )}
            />
        </View>


        <SectionTitle textOne='Popular' textTwo='Workouts' />
        <View style={styles.buttonGroup}>
          <LegendList
            data={routines.slice(0, 5)} 
            estimatedItemSize={124}
            horizontal={true}
            recycleItems
            alignItemsAtEnd
            maintainScrollAtEnd
            maintainScrollAtEndThreshold={0.1}
            renderItem={({ item }) => (
              <Routinebutton routineName={item.name} playIcon={true}  />
              )}
            />
        </View>



     

      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700'
  },
  sectionTitleText: {
    fontWeight: '700', 
    fontSize: 32,
    color: "#6E49EB",
    margin: 10
  },
  buttonGroup: {
    height: 160, 
  }
})

export default Workout