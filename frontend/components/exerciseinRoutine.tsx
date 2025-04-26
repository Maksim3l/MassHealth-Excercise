import { View, Text, StyleSheet, Pressable } from 'react-native';
import React, { useState } from 'react';
import RoutinesIcon from '../assets/tsxicons/routinesnavbaricon';
import PlusIcon from '../assets/tsxicons/plusicon';
import MinusIcon from '../assets/tsxicons/minusicon';
import Svg from 'react-native-svg';

interface ExerciseInRoutineProps {
  exerciseName: string;
  reps?: string;
  time?: string;
  press?: boolean;
  emoji?: Svg
}

const ExerciseinRoutine: React.FC<ExerciseInRoutineProps> = ({ exerciseName, reps, time, press }) => {
  const [isPressed, setPressed] = useState(false);

  const handlePress = () => {
    if (press) {
      setPressed(prev => !prev);
    }
  };

  const containerStyle = [
    styles.container,
    isPressed && press ? styles.pressedContainer : null,
  ];

  const exerciseNameStyle = [
    styles.exerciseName,
    isPressed && press ? styles.pressedText : null,
  ];

  return (
    <Pressable style={containerStyle} onPress={handlePress}>
      <View style={styles.innerStyle}>
        <View style={styles.iconBackground}>
          <RoutinesIcon height={24} width={24} color={isPressed && press ? "white" : "#6E49EB"} />
        </View>
        <Text style={exerciseNameStyle}>{exerciseName}</Text>
      </View>

      <View style={styles.rightSide}>
        {reps && (
          <Text style={[styles.repsText, isPressed && press ? styles.pressedText : null]}>
            {reps}
          </Text>
        )}
        {press && ( // only if press is true
          isPressed ? (
            <MinusIcon strokeColor={isPressed ? "white" : "#6E49EB"} width={24} height={24} />
          ) : (
            <PlusIcon strokeColor={isPressed ? "white" : "#6E49EB"} width={24} height={24} />
          )
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    margin: 20,
    borderRadius: 14,
    backgroundColor: 'white', 
    shadowColor: '#6E49EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  pressedContainer: {
    backgroundColor: '#6E49EB',
  },
  innerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBackground: {
    padding: 10,
  },
  exerciseName: {
    marginLeft: 8,
    fontSize: 20,
    color: '#000',
  },
  pressedText: {
    color: 'white',
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  repsText: {
    color: '#6E49EB',
    fontSize: 20,
    marginRight: 10,
  },
});

export default ExerciseinRoutine;
