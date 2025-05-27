import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import BackIcon from '../../assets/tsxicons/backIcon'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/input'
import DefButton from '../../components/button'
import { supabase } from '../../utils/supabase'
import { LegendList } from '@legendapp/list'

// Define types based on your database schema
type ExerciseInRoutine = {
  id: number;
  excercise_id: number;
  routine_id: number;
  is_set_type: boolean;
  num_of_sets: number;
  num_of_reps: number;
  time_held: number | null;
}

type ExerciseWithDetails = ExerciseInRoutine & {
  exerciseName: string;
  overview: string | null;
  video: any;
}

const EditRoutine = () => {
  const { routineId } = useLocalSearchParams();
  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoutineData();
  }, [routineId]);

  const fetchRoutineData = async () => {
    if (!routineId) return;

    try {
      setLoading(true);
      
      // Get routine information
      const { data: routineData, error: routineError } = await supabase
        .from('Routine')
        .select('name')
        .eq('id', routineId)
        .single();
      
      if (routineError) {
        console.error('Error fetching routine:', routineError);
        return;
      }
      
      setRoutineName(routineData?.name || '');
      
      // Get exercises in this routine
      const { data: exercisesInRoutine, error: exercisesError } = await supabase
        .from('Excercise_in_Routine')
        .select('*')
        .eq('routine_id', routineId);
      
      if (exercisesError) {
        console.error('Error fetching exercises in routine:', exercisesError);
        return;
      }
      
      // Fetch exercise details for each exercise
      const exercisePromises = exercisesInRoutine.map(async (routineExercise) => {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('Excercise')
          .select('name, description, video')
          .eq('id', routineExercise.excercise_id)
          .single();
          
        if (exerciseError) {
          console.error(`Error fetching exercise ${routineExercise.excercise_id}:`, exerciseError);
          return {
            ...routineExercise,
            exerciseName: `Unknown Exercise (ID: ${routineExercise.excercise_id})`,
            overview: null,
            video: null
          };
        }
        
        return {
          ...routineExercise,
          exerciseName: exerciseData?.name || `Unknown Exercise (ID: ${routineExercise.excercise_id})`,
          overview: exerciseData?.description,
          video: exerciseData?.video
        };
      });
      
      const exercisesWithNames = await Promise.all(exercisePromises);
      setExercises(exercisesWithNames);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    if (!routineId) return;
    
    try {
      setSaving(true);
      
      // Update routine name
      const { error: routineError } = await supabase
        .from('Routine')
        .update({ name: routineName })
        .eq('id', routineId);
      
      if (routineError) {
        console.error('Error updating routine:', routineError);
        return;
      }
      
      // Update exercise details
      for (const exercise of exercises) {
        const updateData = {
          num_of_sets: exercise.num_of_sets,
          num_of_reps: exercise.num_of_reps,
          time_held: exercise.time_held
        };
        
        const { error } = await supabase
          .from('Excercise_in_Routine')
          .update(updateData)
          .eq('id', exercise.id);
        
        if (error) {
          console.error(`Error updating exercise ${exercise.id}:`, error);
        }
      }
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error saving routine:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateExerciseValue = (exerciseId: number, field: keyof ExerciseInRoutine, value: number) => {
    setExercises(prevExercises => {
      return prevExercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.title}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Edit Routine</Text>
        </View>
      </View>
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Routine name</Text>
      </View>
      <Input
        value={routineName}
        onChangeText={setRoutineName}
        style={styles.inputContainer}
      />
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Exercises</Text>
      </View>
      
      <LegendList
        data={exercises}
        estimatedItemSize={150} // edit controls
        renderItem={({ item }) => (
          <View style={styles.exerciseContainer}>
            <View style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{item.exerciseName}</Text>
            </View>
            
            <View style={styles.editControls}>
              {item.is_set_type ? (
                <View style={styles.editRow}>
                  <View style={styles.editItem}>
                    <Text style={styles.editLabel}>Sets:</Text>
                    <TextInput
                      style={styles.editInput}
                      keyboardType="numeric"
                      value={item.num_of_sets.toString()}
                      onChangeText={(value) => updateExerciseValue(item.id, 'num_of_sets', parseInt(value) || 0)}
                    />
                  </View>
                  <View style={styles.editItem}>
                    <Text style={styles.editLabel}>Reps:</Text>
                    <TextInput
                      style={styles.editInput}
                      keyboardType="numeric"
                      value={item.num_of_reps.toString()}
                      onChangeText={(value) => updateExerciseValue(item.id, 'num_of_reps', parseInt(value) || 0)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.editItem}>
                  <Text style={styles.editLabel}>Duration (seconds):</Text>
                  <TextInput
                    style={styles.editInput}
                    keyboardType="numeric"
                    value={item.time_held ? item.time_held.toString() : '0'}
                    onChangeText={(value) => updateExerciseValue(item.id, 'time_held', parseInt(value) || 0)}
                  />
                </View>
              )}
            </View>
          </View>
        )}
        recycleItems
        maintainVisibleContentPosition={true}
        contentContainerStyle={styles.workoutsContainer}
        ListEmptyComponent={
          () =>
            loading ? (
              <Text style={styles.emptyText}>Loading exercises...</Text>
            ) : (
              <Text style={styles.emptyText}>No exercises found in this routine.</Text>
            )
        }
      />
      
      <View style={styles.continue}>
        <DefButton 
          text={saving ? "Saving..." : "Save Changes"} 
          onPress={handleSaveRoutine} 
        />
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
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 10
  },
  workoutsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 100 // Ensure space for the button at bottom
  },
  exerciseContainer: {
    marginBottom: 15,
    marginHorizontal: 10,
  },
  exerciseItem: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1, // Allow name to wrap if needed
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: 20
  },
  editControls: {
    backgroundColor: '#f7f5ff',
    borderRadius: 10,
    marginTop: 5,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0d8ff'
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  editLabel: {
    fontSize: 14,
    marginRight: 5,
    color: '#6E49EB'
  },
  editInput: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0d8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 60,
    textAlign: 'center'
  },
  continue: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

export default EditRoutine;