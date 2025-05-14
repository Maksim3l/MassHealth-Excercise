import { router, Stack } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import ExerciseinRoutine from '../../components/exerciseinRoutine'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset
} from 'react-native-reanimated';
import DefButton from '../../components/button';
import BackIcon from '../../assets/tsxicons/backIcon';
import DeleteIcon from '../../assets/tsxicons/deleteicon';
import EditIcon from '../../assets/tsxicons/editicon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

interface routineInfo {
  routineName?: string
}

// Define types based on your actual database schema
type ExerciseInRoutine = {
  id: number;
  excercise_id: number;
  routine_id: number;
  is_set_type: boolean;
  num_of_sets: number;
  num_of_reps: number;
  time_held: number | null;
}

type Exercise = {
  id: number;
  name: string;
  description: string | null;
  video: JSON | null;
}

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 400;

const routinepreview: React.FC<routineInfo> = () => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const routineName = useSearchParams().get('routineName');
  
  // Add state for routine and exercises
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<(ExerciseInRoutine & { exerciseName: string; overview: string | null; video: number | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoutineExercises() {
      if (!routineName) return;
      
      try {
        setLoading(true);
        console.log(`Fetching routine with name: ${routineName}`);
        
        // Step 1: Get the routine ID based on the name
        const { data: routineData, error: routineError } = await supabase
          .from('Routine')
          .select('id')
          .eq('name', routineName)
          .single();
        
        if (routineError) {
          console.error('Error fetching routine:', routineError);
          return;
        }
        
        if (!routineData) {
          console.error('Routine not found');
          return;
        }
        
        const rId = routineData.id;
        setRoutineId(rId);
        console.log(`Found routine with ID: ${rId}`);
        
        // Step 2: Get exercises in this routine from Excercise_in_Routine table
        const { data: exercisesInRoutine, error: exercisesError } = await supabase
          .from('Excercise_in_Routine')
          .select('*')
          .eq('routine_id', rId);
        
        if (exercisesError) {
          console.error('Error fetching exercises in routine:', exercisesError);
          return;
        }
        
        console.log(`Found ${exercisesInRoutine.length} exercises in routine`);
        
        // Step 3: Fetch exercise details for each exercise
        const exercisePromises = exercisesInRoutine.map(async (routineExercise) => {
          // Get exercise details from Excercise table
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
            overview: exerciseData?.description ?? null,
            video: exerciseData?.video ?? null
          };
        });
        
        const exercisesWithNames = await Promise.all(exercisePromises);
        setExercises(exercisesWithNames);
        console.log('Processed exercises:', exercisesWithNames);
      } catch (error) {
        console.error('Unexpected error fetching routine exercises:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRoutineExercises();
  }, [routineName]);

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-IMG_HEIGHT, 0, IMG_HEIGHT],
            [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
          )
        },
        {
          scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1])
        }
      ]
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT / 1.5], [0, 1])
    };
  });

  const formatSetsReps = (exercise: ExerciseInRoutine) => {
    if (exercise.is_set_type) {
      return `${exercise.num_of_sets}×${exercise.num_of_reps}`;
    }
    // For time-based exercises
    return exercise.time_held ? `${exercise.time_held}s` : "Hold";
  };

  const handleDeleteRoutine = async () => {
  if (!routineId) return;
  
  try {
    // First delete exercises in routine
    await supabase
      .from('Excercise_in_Routine')
      .delete()
      .eq('routine_id', routineId);
      
    // Then delete the routine itself
    await supabase
      .from('Routine')
      .delete()
      .eq('id', routineId);
      
    router.back();
  } catch (error) {
    console.error('Error deleting routine:', error);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerLeft: () => <Text>Back</Text>,
          headerBackground: () => <Animated.View style={[styles.header, headerAnimatedStyle]} />,
        }}
      />
      <View style={{ flex: 1 }}>
        <View style={styles.topButtonRow}>
          <View style={styles.backButtonContainer}>
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon stroke={'white'} width={24} height={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.editDeleteButtonContainer}>
            <TouchableOpacity onPress={() => handleDeleteRoutine() }>
              <DeleteIcon stroke={'white'} width={24} height={24} />
            </TouchableOpacity >
            <TouchableOpacity onPress={() => router.push(`/editroutine?routineId=${routineId}`)}>
              <EditIcon stroke={'white'} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.ScrollView
          ref={scrollRef}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 100 }} 
        >
          <Animated.Image
            source={require('../../assets/backgroundForView.png')}
            style={[styles.image, imageAnimatedStyle]}
          />
          <View style={{ backgroundColor: '#fff' }}>
            <Text style={styles.title}>
              {routineName}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6E49EB" />
                <Text style={styles.loadingText}>Loading exercises...</Text>
              </View>
            ) : exercises.length > 0 ? (
              // Map through exercises and render each one
              exercises.map((exercise) => (
                <ExerciseinRoutine 
                  key={exercise.id}
          		  overview={exercise.overview ?? ""}
                  video={typeof exercise.video === 'object' && exercise.video !== null ? exercise.video : {} as JSON}
                  exerciseName={exercise.exerciseName} 
                  reps={formatSetsReps(exercise)}
                  press={false}
                  destination="/excercisedescription"
                />
              ))
            ) : (
              <Text style={styles.noExercisesText}>No exercises found in this routine</Text>
            )}
          </View>
        </Animated.ScrollView>

        <View style={styles.continue}>
          <DefButton text="Start Workout" onPress={() => console.log("workout started")} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default routinepreview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  image: {
    width: width,
    height: IMG_HEIGHT
  },
  header: {
    backgroundColor: '#fff',
    height: 100,
    borderWidth: StyleSheet.hairlineWidth
  },
  backButtonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 20,
    padding: 10,
    position: 'absolute',
    top: 30, 
    left: 20,
    zIndex: 20,
  },
  editDeleteButtonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 20,
    padding: 10,
    position: 'absolute',
    top: 30, 
    right: 20,
    zIndex: 20,
    flexDirection: 'row'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: "#6E49EB",
  },
  continue: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  topButtonRow: {
    flexDirection: 'row'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  noExercisesText: {
    textAlign: 'center',
    padding: 20,
    color: '#888'
  }
});