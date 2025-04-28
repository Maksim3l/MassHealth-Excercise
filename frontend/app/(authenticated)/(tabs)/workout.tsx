import { View, Text, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import WorkoutIcon from '../../../assets/tsxicons/workoutnavbaricon';
import SectionTitle from '../../../components/sectiontitle';
import Routinebutton from '../../../components/routinebutton';
import { LegendList } from '@legendapp/list';
import CurrentExerciseList from '../currentexcercise'; // Correct the name to match the component

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
        <WorkoutIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Workout</Text>
      </View>

      <SectionTitle textOne="Your" textTwo="Workouts" />
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
            <Routinebutton
              routineName={item.name}
              playIcon={true}
              onPress={() => console.log(`${item.name}`)}
            />
          )}
        />
      </View>

      <SectionTitle textOne="Active" textTwo="Workout" />

      <View style={styles.currentExerciseContainer}>
        <Text style={styles.currentExerciseText}>Leg day - 7 sets, 30 sec</Text>
      </View>
      
      <CurrentExerciseList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    marginTop: 10,
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700',
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10,
  },
  buttonGroup: {
    height: 160,
  },
  currentExerciseContainer: {
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#6E49EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentExerciseText: {
    color: 'white',
  },
});

export default Workout;
