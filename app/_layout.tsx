
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, Tabs, Link } from 'expo-router';
import ".././global.css"


export default function Layout() {
  return (
    <View style={styles.container}>
      <Text>Hello from Layout</Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
