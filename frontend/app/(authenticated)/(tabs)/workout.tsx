import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import WorkoutIcon from '../../../assets/tsxicons/workoutnavbaricon';
import SectionTitle from '../../../components/sectiontitle';
import Routinebutton from '../../../components/routinebutton';
import { LegendList } from '@legendapp/list';
import CurrentExerciseList from '../currentexcercise';
import { supabase } from '../../../utils/supabase';
import { useRouter } from 'expo-router';

type Routine = {
  id: number;
  name: string;
};

const Workout = () => {
  const router = useRouter();
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [routineDetails, setRoutineDetails] = useState<{sets: number, duration: number} | null>(null);

  const fetchRoutines = useCallback(async () => {
    try {
      setLoadingRoutines(true);
      
      const { data, error } = await supabase
        .from('Routine')
        .select('id, name')
      
      if (error) {
        console.error('Error fetching routines:', error);
        return;
      }
      
      setUserRoutines(data || []);
    } catch (error) {
      console.error('Unexpected error in fetchRoutines:', error);
    } finally {
      setLoadingRoutines(false);
    }
  }, []);

  //fetch routine details
const fetchRoutineDetails = useCallback(async (routineName: string) => {
  try {
    const { data, error } = await supabase
      .from('Routine')
      .select('*')  
      .eq('name', routineName)
      .single();
    
    if (error) {
      console.error('Error fetching routine details:', error);
      return;
    }
    
    setRoutineDetails({
      sets: data.num_of_sets || 0,
      duration: data.duration || 0 
    });
  } catch (error) {
    console.error('Unexpected error in fetchRoutineDetails:', error);
  }
}, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  useEffect(() => {
    if (selectedRoutine) {
      fetchRoutineDetails(selectedRoutine);
    }
  }, [selectedRoutine, fetchRoutineDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
      return () => {};
    }, [fetchRoutines])
  );

  const navigateToPreview = (routineName: string) => {
    router.push(`../routinepreview?routineName=${routineName}`);
  };

  const selectRoutine = (routineName: string) => {
    setSelectedRoutine(routineName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <WorkoutIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Workout</Text>
      </View>

      <SectionTitle textOne="Your" textTwo="Workouts" />
      <View style={styles.buttonGroup}>
        {loadingRoutines ? (
          <Text style={styles.loadingText}>Loading workouts...</Text>
        ) : userRoutines.length > 0 ? (
          <LegendList
            data={userRoutines}
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
                onPress={() => selectRoutine(item.name)}
              />
            )}
          />
        ) : (
          <Text style={styles.emptyText}>No workouts found</Text>
        )}
      </View>

      {selectedRoutine ? (
        <>
          <SectionTitle textOne={selectedRoutine} textTwo="Details" />
          <View style={styles.routineDetailsContainer}>
            <Text style={styles.routineDetailsText}>
              {selectedRoutine} - {routineDetails?.sets || 0} sets, {routineDetails?.duration || 0} sec
            </Text>
          </View>
          <CurrentExerciseList routineName={selectedRoutine} />
        </>
      ) : (
        <>
          <SectionTitle textOne="Active" textTwo="Workout" />
          <View style={styles.currentExerciseContainer}>
            <Text style={styles.currentExerciseText}>Select a workout above</Text>
          </View>
          <CurrentExerciseList />
        </>
      )}
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
  routineDetailsContainer: {
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#6E49EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routineDetailsText: {
    color: 'white',
  },
  loadingText: {
    padding: 10,
    color: '#888',
    marginLeft: 20,
  },
  emptyText: {
    padding: 10,
    color: '#888',
    marginLeft: 20,
  },
});

export default Workout;