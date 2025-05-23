import { View, Text, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import  ActivityIcon  from '../../../assets/tsxicons/activitynavbaricon'
import Value from '../../../components/Value'
import RingProgress from '../../../components/RingProgress'
import BrokenHealthKit, { HealthInputOptions, HealthKitPermissions, HealthUnit } from "react-native-health";
import useHealthData from '../../../hooks/useHealthData'


const STEP_GOAL = 10000
const Activity = () => {
  const {steps, flights, distance} = useHealthData({ date: new Date(2025, 5, 21) });
  return (

    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ActivityIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Activity</Text>
      </View>
      <RingProgress radius={130} strokeWidth={50} progress={steps / STEP_GOAL} />

      <View style={styles.values}>
       <Value label="Steps" value={steps.toString()}></Value>
       <Value label="Distance" value={`${(distance / 1000).toFixed()} km`}></Value>
      <Value label="Flights climbed" value={flights.toString()}></Value>


      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 12
  },
  sectionTitle: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    alignItems: 'center' 
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10 
  },
  label: {
    fontSize: 20
    
  },
  values: {
    flexDirection: 'row',
    gap: 25,
    flexWrap: 'wrap',
    marginTop: 40
  },
  value: {
    fontSize: 45,
    fontWeight: 500,
  },
  valueContainer: {
  }

})

export default Activity
