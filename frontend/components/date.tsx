import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import React from 'react';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

interface dateProps {
  day: string;
  dayOfMonth: number;
  isToday?: boolean; 
}

const CustomDate: React.FC<dateProps> = ({ day, dayOfMonth, isToday }) => {
  return (
    <Pressable style={[styles.container, isToday && styles.todayContainer]}>
      <View style={styles.dateContainer}>
        <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
        <Text style={[styles.dayOfMonthText, isToday && styles.todayText]}>{dayOfMonth}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    width: width * 0.11,
    borderColor: '#A4A4A8',
    borderWidth: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  todayContainer: {
    borderColor: '#6E49EB', 
  },
  dateContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: '#A4A4A8',
    fontSize: 16,
  },
  dayOfMonthText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#000',
  },
  todayText: {
    color: '#6E49EB',
    fontWeight: '700',
  },
});

export default CustomDate;
