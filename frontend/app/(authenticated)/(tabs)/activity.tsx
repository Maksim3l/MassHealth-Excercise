import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import  ActivityIcon  from '../../../assets/tsxicons/activitynavbaricon'


const Activity = () => {
  return (
    <SafeAreaView>
      <View style={styles.sectionTitle}>
        <ActivityIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Activity</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
})

export default Activity