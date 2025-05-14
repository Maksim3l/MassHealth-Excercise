import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import BackIcon from '../../assets/tsxicons/backIcon'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/input'
import TagButton from '../../components/tag'
import ExerciseinRoutine from '../../components/exerciseinRoutine'
import DefButton from '../../components/button'
import { supabase } from '../../utils/supabase'

type Muscle = {
  id: number;
  name: string;
};

type Exercise = {
  video: JSON
  id: number;
  name: string;
  equipment_id?: number;
  experience_level_id?: number;
  mechanics_type_id?: number;
  force_type_id?: number;
  exercise_type_id?: number;
  description?: string;
  instructions?: string;
  tips?: string;
};

type SelectedExercise = {
  id: number;
  name: string;
  video_urls: JSON;
  overview: string;
  sets: number;
  reps: number;
  isSelected: boolean;
};


const CreateRoutine = () => {
  const [routineName, setRoutineName] = useState('')
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<number | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0); // force re-render

useEffect(() => {
  async function fetchMuscles() {
    try {
      console.log("Starting muscle fetch...");
      setLoading(true);

      // Log connection details (without sensitive info)
      console.log("Supabase connection state:", supabase ? "initialized" : "not initialized");

      // query
      console.log("Sending request to Muscles table");
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('Muscles')
        .select('*')

      const requestTime = Date.now() - startTime;
      console.log(`Request completed in ${requestTime}ms`);

      if (error) {
        console.error('Error fetching muscles:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        return;
      }

      console.log(`Successfully fetched ${data?.length} muscle groups`);
      console.log("Sample data:", data?.slice(0, 2));

      setMuscles(data || []);
    } catch (error) {
      console.error('Unexpected error in fetchMuscles:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error);
      }
    } finally {
      setLoading(false);
      console.log("Muscle fetch completed");
    }
  }

  fetchMuscles();
}, []);

  // This function checks if an exercise is selected
  const isExerciseSelected = (exerciseId: number): boolean => {
    return selectedExercises.some(ex => ex.id === exerciseId);
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    console.log(`Toggling exercise: ${exercise.name}, ID: ${exercise.id}`);
    
    // Check if the exercise is already selected
    const existingIndex = selectedExercises.findIndex(item => item.id === exercise.id);
    
    if (existingIndex >= 0) {
      // If already selected, remove it
      console.log('Removing exercise from selection');
      setSelectedExercises(prev => 
        prev.filter(item => item.id !== exercise.id)
      );
      setSelectedCount(prev => prev - 1); // Update counter to force re-render
    } else {
      // If not selected, add it with default values
      console.log('Adding exercise to selection');
      setSelectedExercises(prev => [
              ...prev, 
              { 
                id: exercise.id, 
                name: exercise.name, 
                video_urls: (exercise as any).video_urls ?? [], 
                overview: (exercise as any).overview ?? '', 
                sets: 3, 
                reps: 10,
                isSelected: true
              }
            ]);
      setSelectedCount(prev => prev + 1); 
    }
  };

  // Handle tag selection
  const handleTagPress = async (id: number) => {
    // Toggle selection if pressing the same tag
    if (selectedMuscle === id) {
      setSelectedMuscle(null);
      setExercises([]);
      return;
    } 

    setSelectedMuscle(id);
    setLoadingExercises(true);
    try {
      const { data, error } = await supabase
        .from('Exercise_Muscles')
        .select('exercise_id, Exercises(*)')
        .eq('muscle_id', id)

      if(error) {
        console.error('Error fetching exercises', error);
        return
      }

      const fetchedExercises = data.map((item: any) => item.Exercises )
      setExercises(fetchedExercises);
    } catch(err){
      console.error('Unexpected error fetching', err)
    } finally {
      setLoadingExercises(false);
    }
  };

  // Format reps for display
  const formatSetsReps = (exercise: Exercise) => {
    const selectedExercise = selectedExercises.find(e => e.id === exercise.id);
    if (selectedExercise) {
      return `${selectedExercise.sets}×${selectedExercise.reps}`;
    }
    return "Add"; // Default text when not selected
  };

  const saveRoutine = async () => {
  console.log(`Selected exercises count: ${selectedExercises.length}`);
  
  if(!routineName){
    Alert.alert("Error", "Please enter a routine name")
    return;
  }

  if(selectedExercises.length === 0) {
    Alert.alert("Error", "Please select at least one exercise");
    return;
  }

  try {
    setSavingRoutine(true);

    // 1. First create the routine
    const {data: RoutineData, error: routineError} = await supabase
      .from('Routine')
      .insert([
        {
          name: routineName,
          is_recurring: false,
          days_recurring: null,
          picture: null
        }
      ])
      .select();

    if(routineError) {
      throw new Error(`Error creating routine: ${routineError.message}`);
    }

    if (!RoutineData || RoutineData.length === 0) {
      throw new Error('Failed to create routine: No data returned');
    }

    const routineId = RoutineData[0].id;

    const excerciseInsertPromises = selectedExercises.map(exercise => {
      const videoData = exercise.video_urls || null;
      return supabase
        .from('Excercise')  
        .insert([
          {
            name: exercise.name,
            description: exercise.overview,
            video: typeof videoData === 'string' ? videoData : JSON.stringify(videoData)

          }
        ])
        .select();  
    });

    const excerciseResults = await Promise.all(excerciseInsertPromises);
    
    // Check for errors in exercise insertion
    const excerciseInsertErrors = excerciseResults
      .filter(result => result.error)
      .map(result => result.error?.message);
    
    if (excerciseInsertErrors.length > 0) {
      throw new Error(`Error inserting exercises: ${excerciseInsertErrors.join(', ')}`);
    }

    // 3. Now create the relationship records with the new excercise IDs
    const relationshipPromises = excerciseResults.map((result, index) => {
      // Get the new exercise ID from the insert result
      const newExcerciseId = result.data?.[0].id;
      const originalExercise = selectedExercises[index]; 
      
      return supabase
        .from('Excercise_in_Routine')
        .insert([
          {
            excercise_id: newExcerciseId, 
            routine_id: routineId,
            is_set_type: true,
            num_of_sets: originalExercise.sets,
            num_of_reps: originalExercise.reps,
            time_held: null
          }
        ]);
    });

    const relationshipResults = await Promise.all(relationshipPromises);
    
    // Check for errors in relationship creation
    const relationshipErrors = relationshipResults
      .filter(result => result.error)
      .map(result => result.error?.message);
    
    if (relationshipErrors.length > 0) {
      throw new Error(`Error linking exercises to routine: ${relationshipErrors.join(', ')}`);
    }

    Alert.alert(
      "Success", 
      "Routine created successfully!", 
      [{ text: "OK", onPress: () => router.back() }]
    );

  } catch (error) {
    console.error('Error saving routine:', error);
    Alert.alert("Error", error instanceof Error ? error.message : "Failed to save routine");
  } finally {
    setSavingRoutine(false);
  }
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
          <Text style={styles.text}>Create a routine</Text>
        </View>
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Routine name</Text>
      </View>
      <Input
        value={routineName}
        onChangeText={setRoutineName}
        style={styles.inputContainer}
        placeholder="Enter routine name"
      />

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Muscle Groups</Text>
      </View>

      <View style={styles.tagListContainer}>
        {loading ? (
          <Text>Loading muscle groups...</Text>
        ) : (
          <FlatList
            data={muscles}
            numColumns={3}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TagButton 
                onPress={() => handleTagPress(item.id)}
                text={item.name}
                textSize='14'
              />
            )}
            contentContainerStyle={styles.tagListContent}
            columnWrapperStyle={styles.tagColumnWrapper}
          />
        )}
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Workouts {selectedExercises.length > 0 ? `(${selectedExercises.length} selected)` : ''}
        </Text>
      </View>
      
      <FlatList
        data={exercises}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <ExerciseinRoutine
            exerciseName={item.name}
            overview={item.description ?? ''}
            video={item.video}
            reps={formatSetsReps(item)}
            press={true}
            isSelected={isExerciseSelected(item.id)} 
            onPress={() => toggleExerciseSelection(item)}
            destination="/excercisepreview"
          />
        )}
        contentContainerStyle={styles.workoutsContainer}
        ListEmptyComponent={
          loadingExercises ? (
            <Text style={styles.emptyText}>Loading exercises...</Text>
          ) : (
            <Text style={styles.emptyText}>
              {selectedMuscle
                ? "No exercises found for this muscle group"
                : "Select a muscle group to see exercises"}
            </Text>
          )
        }
      />

      {/* Status bar for debugging */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Selected exercises: {selectedExercises.length}
        </Text>
      </View>

      <View style={styles.continue}>
        <DefButton 
          text={savingRoutine ? "Creating..." : "Create Routine"} 
          onPress={saveRoutine}
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
  tagListContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    height: 120, 
  },
  tagListContent: {
    paddingVertical: 5,
  },
  tagColumnWrapper: {
    justifyContent: 'center',
    marginBottom: 5,
  },
  workoutsContainer: {
    padding: 10,
    paddingBottom: 100,
  },
  statusBar: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    padding: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  continue: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  }
});

export default CreateRoutine