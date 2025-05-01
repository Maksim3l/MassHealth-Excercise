import { View, Text, SafeAreaView, StyleSheet } from 'react-native'
import React from 'react'
import { ScrollView } from 'react-native'
import SectionTitle from '../../../components/sectiontitle'
import HomeIcon from '../../../assets/tsxicons/homenavbaricon'

const home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.sectionTitle}>
            <HomeIcon color={"#6E49EB"} fill={"white"} ></HomeIcon>
            <Text style={styles.sectionTitleText}>Home</Text>
          </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    marginTop: 10

  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700'

  },
  sectionTitleText: {
    fontWeight: 700,
    fontSize: 32,
    color: "#6E49EB",
    margin: 10
  },

})

export default home