import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SwipeListView } from 'react-native-swipe-list-view';
import LegIcon from '../../assets/tsxicons/legicon';
import PlayIcon from '../../assets/tsxicons/playicon_';
import TimerIcon from '../../assets/tsxicons/timericon';
import DoneIcon from '../../assets/tsxicons/doneicon';
import { router } from 'expo-router';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { supabase } from '../../utils/supabase';

type Exercise = {
  key: string;
  excercise_id: number;
  exerciseName: string;
  description?: string,
  videoUrls?: any,
  reps: string;
  playWorkout: boolean;
  doneWorkout: boolean;
  is_set_type: boolean;
  num_of_sets: number;
  num_of_reps: number;
  time_held: number | null;
  remaining_sets: number;
  total_sets: number;
};

type CurrentExerciseListProps = {
  routineName?: string;
};

const CurrentExerciseList = ({ routineName }: CurrentExerciseListProps) => {
  const [listData, setListData] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (routineName) {
      fetchExercisesForRoutine(routineName);
    } else {
      // Set default data 
      setListData([]);
      
    }
  }, [routineName]);

  const formatSetsReps = (exercise: Exercise) => {
    if (exercise.is_set_type) {
      return `${exercise.remaining_sets}×${exercise.num_of_reps}`;
    }
    return exercise.time_held ? `${exercise.time_held}s` : "Hold";
  };

  const fetchExercisesForRoutine = async (name: string) => {
    try {
      setLoading(true);
      
      // Get the routine id first
      const { data: routineData, error: routineError } = await supabase
        .from('Routine')
        .select('id')
        .eq('name', name)
        .single();
      
      if (routineError || !routineData) {
        console.error('Error fetching routine:', routineError);
        return;
      }
      
      type SupabaseExerciseItem = {
        id: number;
        excercise_id: number;
        routine_id: number;
        is_set_type: boolean;
        num_of_sets: number;
        num_of_reps: number;
        time_held: number | null;
        Excercise: { name: string; description?: string; video?: JSON } | { name: string; description?: string; video?: JSON }[] | null;
      };

      const { data: exerciseData, error: exerciseError } = await supabase
        .from('Excercise_in_Routine')
        .select(`
          id, excercise_id, routine_id, 
          is_set_type, num_of_sets, num_of_reps, time_held,
          Excercise(id, name, description, video)
        `)
        .eq('routine_id', routineData.id);

      if (exerciseError) {
        console.error('Error fetching exercises:', exerciseError);
        return;
      }

      // Format the data for our list
      const formattedData = (exerciseData as SupabaseExerciseItem[]).map((item, index) => {
        const exerciseName = Array.isArray(item.Excercise) 
          ? item.Excercise[0]?.name 
          : item.Excercise?.name ?? 'Unknown';
        
        const description = Array.isArray(item.Excercise) 
          ? item.Excercise[0]?.description 
          : item.Excercise?.description ?? '';
        
        const videoUrls = Array.isArray(item.Excercise) 
          ? item.Excercise[0]?.video 
          : item.Excercise?.video ?? null;
        
        const repsString = item.is_set_type 
          ? `${item.num_of_sets}×${item.num_of_reps}` 
          : item.time_held ? `${item.time_held}s` : "Hold";
        
        return {
          key: `${index}`,
          excercise_id: item.excercise_id,
          exerciseName: exerciseName,
          description: description,
          videoUrls: videoUrls,
          reps: repsString,
          playWorkout: false,
          doneWorkout: false,
          is_set_type: item.is_set_type,
          num_of_sets: item.num_of_sets,
          num_of_reps: item.num_of_reps,
          time_held: item.time_held,
          remaining_sets: item.num_of_sets, 
          total_sets: item.num_of_sets 
        };
      });

      setListData(formattedData);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

const togglePlayWorkout = (index: number) => {
  setListData((prevData) => {
    const currentItem = prevData[index];
    
    if (currentItem.doneWorkout) {
      return prevData;
    }
    
    if (!currentItem.playWorkout) {
      return prevData.map((item, i) =>
        i === index ? { ...item, playWorkout: true } : item
      );
    }
    
    // If it's already in play mode, we're completing this set
    if (currentItem.remaining_sets > 1) {
      // Decrease sets by 1 but stay in play mode
      return prevData.map((item, i) =>
        i === index ? { 
          ...item, 
          remaining_sets: item.remaining_sets - 1,
          reps: formatSetsReps({...item, remaining_sets: item.remaining_sets - 1})
        } : item
      );
    } 
    // If this is the last set, mark it as done and check if all exercises are done
    else if (currentItem.remaining_sets === 1) {
      const updatedData = prevData.map((item, i) =>
        i === index ? { 
          ...item, 
          playWorkout: false,
          doneWorkout: true,
          remaining_sets: 0,
          reps: "Completed"
        } : item
      );
      
      // After updating this item, check if all exercises are now done
      setTimeout(async () => {
        const allDone = updatedData.every(item => item.doneWorkout);
        if (allDone && routineName) {
          console.log('All exercises completed via togglePlayWorkout! Updating routine...');
          try {
            const success = await updateRoutineCompletion(routineName);
            console.log('Supabase update from togglePlayWorkout result:', success ? 'Success' : 'Failed');
          } catch (error) {
            console.error('Error updating routine from togglePlayWorkout:', error);
          }
        }
      }, 100);
      
      return updatedData;
    }
    
    // No sets remaining, keep as is
    return prevData;
  });
};

 const markWorkoutAsDone = async (index: number) => {
  try {
    setListData((prevData) => {
      // First, mark the current exercise as done
      const updatedData = prevData.map((item, i) =>
        i === index ? { 
          ...item, 
          doneWorkout: true, 
          playWorkout: false,
          remaining_sets: 0,
          reps: "Completed"
        } : item
      );
      
      // Count completed exercises after the update
      const completedCount = updatedData.filter(ex => ex.doneWorkout).length;
      const totalExercises = updatedData.length;
      
      // Log progress with actual numbers
      console.log(`Workout progress: ${completedCount}/${totalExercises}`);
      
      // Check if all exercises are completed
      const allExercisesDone = completedCount === totalExercises;
      
      if (allExercisesDone && routineName) {
        console.log('All exercises completed! Updating routine status...');
        setTimeout(async () => {
          const success = await updateRoutineCompletion(routineName);
          if (!success) {
            console.warn('Failed to update routine completion status');
          } else {
            console.log('Routine marked as completed successfully');
          }
        }, 0);
      }
      
      return updatedData;
    });
  } catch (error) {
    console.error('Error marking workout as done:', error);
  }
};

  const updateRoutineCompletion = async (routineName: string) => {
  console.log(`Starting updateRoutineCompletion for routine: ${routineName}`);
  try {
    // First, get the routine record
    const { data: routineData, error: routineError } = await supabase
      .from('Routine')
      .select('id, is_recurring, days_recurring')
      .eq('name', routineName)
      .single();
    
    if (routineError) {
      console.error('Error fetching routine data:', routineError);
      return false;
    }
    
    if (!routineData) {
      console.error(`No routine found with name: ${routineName}`);
      return false;
    }
    
    console.log(`Found routine with ID: ${routineData.id}`);
    
    // Format today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Setting days_recurring to: ${today}`);
    
    // Now update the routine
    const updateResult = await supabase
      .from('Routine')
      .update({
        is_recurring: true,
        days_recurring: today
      })
      .eq('id', routineData.id);
    
    if (updateResult.error) {
      console.error('Error updating routine:', updateResult.error);
      return false;
    }
    
    console.log('Successfully updated routine in Supabase:', updateResult);
    return true;
  } catch (e) {
    console.error('Unexpected error in updateRoutineCompletion:', e);
    return false;
  }
};

  const resetWorkout = (index: number) => {
    setListData((prevData) => {
      const item = prevData[index];
      return prevData.map((item, i) =>
        i === index ? { 
          ...item, 
          doneWorkout: false, 
          playWorkout: false,
          remaining_sets: item.total_sets, // Reset to original number of sets
          reps: formatSetsReps({...item, remaining_sets: item.total_sets})
        } : item
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  }

  return (
    <SwipeListView
      data={listData}
      renderItem={({ item, index }) => (
        <ExerciseRow
          item={item}
          index={index}
          togglePlayWorkout={togglePlayWorkout}
          markWorkoutAsDone={markWorkoutAsDone}
        />
      )}
      renderHiddenItem={({ item, index }) => (
        <View style={styles.rowBack}>
          {/* Left side (revealed when swiping right) */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {
              router.push({
                pathname: "/excercisedescription",
                params: {
                  exerciseName: item.exerciseName,
                  description: item.description,
                  videoUrls: item.videoUrls
                }
              });
            }}
          >
            <Text style={styles.actionText}>Preview</Text>
          </TouchableOpacity>
                    
          {/* Right side (revealed when swiping left) */}
          <View style={styles.rightButtons}>
            {(item.playWorkout || item.doneWorkout) && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => resetWorkout(index)}
              >
                <Text style={styles.actionText}>Reset</Text>
              </TouchableOpacity>
            )}
            {item.playWorkout && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => markWorkoutAsDone(index)}
              >
                <Text style={styles.actionText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      rightOpenValue={-180}
      leftOpenValue={120}
      disableRightSwipe={false}
    />
  );
};

const ExerciseRow = ({
  item,
  index,
  togglePlayWorkout,
  markWorkoutAsDone,
}: {
  item: Exercise;
  index: number;
  togglePlayWorkout: (index: number) => void;
  markWorkoutAsDone: (index: number) => void;
}) => {
  // Calculate progress percentage based on remaining sets
  const calculateProgress = () => {
    if (item.doneWorkout) return 100;
    if (item.total_sets === 0) return 0;
    
    // Calculate percentage of sets completed
    const setsCompleted = item.total_sets - item.remaining_sets;
    return (setsCompleted / item.total_sets) * 100;
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerStyle}>
        <View style={styles.circle}>
          <AnimatedCircularProgress
            size={62}
            width={2}
            fill={calculateProgress()}
            tintColor={item.doneWorkout ? "#4CAF50" : "#6E49EB"}
            backgroundColor="#E0E0E0"
            rotation={0}
            duration={500}
          >
            {
              () => (
                <LegIcon 
                  width={32} 
                  height={32} 
                  strokeColor={item.doneWorkout ? "#4CAF50" : "#6E49EB"} 
                />
              )
            }
          </AnimatedCircularProgress>
        </View>
        <View style={styles.textContainer}>
          <Text numberOfLines={2} style={styles.exerciseName}>{item.exerciseName}</Text>
          <Text style={[
            styles.repsText, 
            item.doneWorkout ? styles.completedText : {}
          ]}>
            {item.reps}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.buttonContainer,
          item.doneWorkout ? styles.doneButtonContainer : {}
        ]}
        onPress={() => togglePlayWorkout(index)}
        disabled={item.doneWorkout} // Disable when done
      >
        {item.doneWorkout ? (
          <DoneIcon strokeColor="white" width={32} height={32} />
        ) : item.playWorkout ? (
          <TimerIcon strokeColor="white" width={32} height={32} />
        ) : (
          <PlayIcon strokeColor="white" width={32} height={32} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: "white",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  innerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 16,
    color: 'black',
    flexWrap: 'wrap',
  },
  repsText: {
    fontSize: 16,
    color: '#A4A4A8',
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  buttonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  doneButtonContainer: {
    backgroundColor: '#4CAF50',
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 20,
  },
  doneButton: {
    backgroundColor: '#6E49EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#6E49EB', 
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    margin: 10,
  },
  previewButton: {
    backgroundColor: '#6E49EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
  },
});

export default CurrentExerciseList;