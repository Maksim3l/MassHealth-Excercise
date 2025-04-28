import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SwipeListView } from 'react-native-swipe-list-view';
import LegIcon from '../../assets/tsxicons/legicon';
import PlayIcon from '../../assets/tsxicons/playicon_';
import TimerIcon from '../../assets/tsxicons/timericon';
import DoneIcon from '../../assets/tsxicons/doneicon'
import { router } from 'expo-router';
import { AnimatedCircularProgress } from 'react-native-circular-progress';


const CurrentExerciseList = () => {
  const [listData, setListData] = useState(
    Array(3)
      .fill('')
      .map((_, i) => ({
        key: `${i}`,
        exerciseName: 'Leg Extension',
        reps: '3x10',
        playWorkout: false, 
        doneWorkout: false, // Flag to track completion
      }))
  );

  // Toggle the playWorkout flag for a specific exercise
  const togglePlayWorkout = (index: number) => {
    setListData((prevData) =>
      prevData.map((item, i) =>
        i === index ? { ...item, playWorkout: !item.playWorkout } : item
      )
    );
  };

  // Mark the workout as done
  const markWorkoutAsDone = (index: number) => {
    setListData((prevData) =>
      prevData.map((item, i) =>
        i === index ? { ...item, doneWorkout: true, playWorkout: false } : item
      )
    );
  };

  // Reset workout status
  const resetWorkout = (index: number) => {
    setListData((prevData) =>
      prevData.map((item, i) =>
        i === index ? { ...item, doneWorkout: false, playWorkout: false } : item
      )
    );
  };

  // Preview exercise details


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
            onPress={() => router.push('/excercisedescription')}
          >
            <Text style={styles.actionText}>Preview</Text>
          </TouchableOpacity>
          
          {/* Right side (revealed when swiping left) */}
          <View style={styles.rightButtons}>
          {item.playWorkout && (
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
      rightOpenValue={-180} // Increased to fit both buttons
      leftOpenValue={120}
      disableRightSwipe={false} // Enable right swipe
    />
  );
};

// ExerciseRow Component
const ExerciseRow = ({
  item,
  index,
  togglePlayWorkout,
  markWorkoutAsDone,
}: {
  item: any;
  index: number;
  togglePlayWorkout: (index: number) => void;
  markWorkoutAsDone: (index: number) => void;
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.innerStyle}>
        <View style={styles.circle}>
          <AnimatedCircularProgress
            size={62}
            width={2}
            fill={item.playWorkout ? 100 : 0} // Fill when playing, empty otherwise
            tintColor="#6E49EB"
            backgroundColor="#E0E0E0"
            rotation={0}
            duration={5000} // 5 seconds for example, adjust as needed
          >
            {
              () => (
                <LegIcon width={32} height={32} strokeColor={'#6E49EB'} />
              )
            }
          </AnimatedCircularProgress>
          </View>
        <View>
          <Text style={styles.exerciseName}>{item.exerciseName}</Text>
          <Text style={styles.repsText}>{item.reps}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => togglePlayWorkout(index)} // Toggle play workout for this specific exercise
      >
        {item.doneWorkout ? (
          // Render DoneIcon if the workout is marked as done
          <DoneIcon strokeColor="white" width={32} height={32} />
        ) : item.playWorkout ? (
          // Render TimerIcon if the workout is in progress
          <TimerIcon strokeColor="white" width={32} height={32} />
        ) : (
          // Render PlayIcon if the workout is not started yet
          <PlayIcon strokeColor="white" width={32} height={32} />
        )}
      </TouchableOpacity>
    </View>
  );
};

// Styles
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
  },
  circle: {
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 20,
    color: 'black',
  },
  repsText: {
    fontSize: 16,
    color: '#A4A4A8',
  },
  buttonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between left and right actions
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
});

export default CurrentExerciseList;