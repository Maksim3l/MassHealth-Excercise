import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import  ActivityIcon  from '../../../assets/tsxicons/activitynavbaricon'
import Value from '../../../components/Value'
import RingProgress from '../../../components/RingProgress'


const Activity = () => {
  return (

    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ActivityIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Activity</Text>
      </View>
      <RingProgress radius={130} strokeWidth={50} progress={0.3} />

      <View style={styles.values}>
       <Value label="Steps" value="1219"></Value>
       <Value label="Distance" value="0,75 km"></Value>
      <Value label="Flights climbed" value="12"></Value>


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