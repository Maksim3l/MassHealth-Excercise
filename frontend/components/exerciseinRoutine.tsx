import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import React, { useRef } from 'react';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import RoutinesIcon from '../assets/tsxicons/routinesnavbaricon';
import PlusIcon from '../assets/tsxicons/plusicon';
import MinusIcon from '../assets/tsxicons/minusicon';
import Svg from 'react-native-svg';

interface ExerciseInRoutineProps {
  exerciseName: string;
  overview: string,
  video: JSON, 
  reps?: string;
  time?: string;
  press?: boolean;
  emoji?: Svg;
  destination: string; // navigate to on swipe
  onPress?: () => void;
  isSelected?: boolean; 
  loading?: boolean;
}

const ExerciseinRoutine: React.FC<ExerciseInRoutineProps> = ({ 
  exerciseName, 
  overview,
  video,
  reps, 
  time, 
  press,
  destination, 
  onPress,
  isSelected = false,
  loading = false
}) => {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);
  
  const handlePress = () => {
    if (press && onPress) {
      onPress();
    }
  };

  const containerStyle = [
    styles.container,
    isSelected && press ? styles.pressedContainer : null,
  ];

  const exerciseNameStyle = [
    styles.exerciseName,
    isSelected && press ? styles.pressedText : null,
  ];

  // Handle navigation when swiped
  const handleSwipeOpen = () => {
    // Close the swipeable after navigation
    if (swipeableRef.current) {
      swipeableRef.current.close();
    }
    
    // each instance of the component to navigate to a different route
    router.push({
      pathname: destination,
      params: { 
        exerciseName,
        description: overview,
        videoUrls: JSON.stringify(video)
      }
    });
  };

  // Render left swipe actions 
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.leftAction,
          { transform: [{ translateX: trans }] }
        ]}
      >
        <Pressable 
          onPress={handleSwipeOpen}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>Details</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, width: '100%' }}>
        <Swipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={40}
        rightThreshold={40}
        renderLeftActions={renderLeftActions}
      >
        <Pressable style={containerStyle} onPress={handlePress}>
          <View style={styles.innerStyle}>
            <View style={styles.iconBackground}>
              <RoutinesIcon 
                height={24} 
                width={24} 
                color={isSelected && press ? "white" : "#6E49EB"} 
              />
            </View>
            <Text style={exerciseNameStyle} numberOfLines={2} ellipsizeMode="tail">{exerciseName}</Text>
          </View>
          
          <View style={styles.rightSide}>
            {reps && (
              <Text style={[styles.repsText, isSelected && press ? styles.pressedText : null]}>
                {reps}
              </Text>
            )}
            
            {loading ? (
              <ActivityIndicator color={isSelected ? "white" : "#6E49EB"} size="small" />
            ) : (
              press && (
                isSelected ? (
                  <MinusIcon 
                    strokeColor={isSelected ? "white" : "#6E49EB"} 
                    width={24} 
                    height={24} 
                  />
                ) : (
                  <PlusIcon 
                    strokeColor={isSelected ? "white" : "#6E49EB"} 
                    width={24} 
                    height={24} 
                  />
                )
              )
            )}
          </View>
        </Pressable>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    margin: 10, 
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
    fontSize: 16,
    color: '#000',
    maxWidth: 100
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
    fontSize: 16,
    marginHorizontal: 10,
  },
  leftAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: '80%',
    marginTop: 10,
    marginLeft: 10,
    backgroundColor: '#6E49EB',
    borderRadius: 12,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ExerciseinRoutine;