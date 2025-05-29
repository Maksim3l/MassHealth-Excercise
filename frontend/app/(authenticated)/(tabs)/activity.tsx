import { View, Text, StyleSheet, Platform } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import ActivityIcon from '../../../assets/tsxicons/activitynavbaricon'
import Value from '../../../components/Value'
import RingProgress from '../../../components/RingProgress'
import AntDesign from '@expo/vector-icons/AntDesign';

//NUJNOO!! glede na OS se importa ustrezni hook
//import useHealthDataios from '../../../hooks/useHealthDataios'
//import useHealthData from '../../../hooks/useHealthData'

//EXPO GO USERS!! zakomentiraj hooks in rocno nastavi steps, flights, distance

const STEP_GOAL = 10000

const Activity = () => {
  const [date, setDate] = useState(new Date());
  
  const changeDate = (numDays: number) => {
    const currentDate = new Date(date); // Create a copy of the current daxte
    // Update the date by adding/subtracting the number of days
    currentDate.setDate(currentDate.getDate() + numDays);
    setDate(currentDate); // Update the state variable
  };

  // NUJNO!! GLEDE NA OS KLICI PRAVI HEALTH DATA
      //const androidHealthData = useHealthData(date);
      //const iosHealthData = useHealthDataios(date)
  // Uncomment this when you have the iOS hook ready

  let steps = 18074, flights = 8.4, distance = 1042;
  
  // NUJNO!! GLEDE NA OS KLICI PRAVI HEALTH DATA
  if (Platform.OS === 'ios') {
    //When you have iOS hook ready, use it here
      //steps = iosHealthData?.steps || 0;
      //flights = iosHealthData?.flights || 0;
      //distance = iosHealthData?.distance || 0;
  } else if (Platform.OS === 'android') {
      //steps = androidHealthData?.steps || 0; [commented for Expo]
      //flights = androidHealthData?.flights || 0; [commented for Expo]
      //distance = androidHealthData?.distance || 0; [commented for Expo]
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ActivityIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Activity</Text>
      </View>

      <View style={styles.datePicker}>
        <AntDesign onPress={() => changeDate(-1)} name="left" size={24} color="black" />
        <Text style={styles.date}>{date.toDateString()}</Text>
        <AntDesign onPress={() => changeDate(1)} name="right" size={24} color="black" />
      </View>
      
      <View style={styles.ringContainer}>
        <RingProgress radius={130} strokeWidth={50} progress={steps / STEP_GOAL} />
      </View>

      <View style={styles.values}>
        <Value label="Steps" value={(steps || 0).toString()} />
        <Value label="Distance" value={`${((distance || 0) / 1000).toFixed()} km`} />
        <Value label="Flights climbed" value={(flights || 0).toString()} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  sectionTitle: { 
    flexDirection: 'row', 
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center' 
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10 
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  values: {
    flexDirection: 'row',
    gap: 25,
    flexWrap: 'wrap',
    marginTop: 30,
    justifyContent: 'center',
    paddingHorizontal: 15
  },
  valueItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center'
  },
  datePicker: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  date: {
    color: 'black',
    fontWeight: '500',
    fontSize: 18,
    marginHorizontal: 10
  }
})

export default Activity
