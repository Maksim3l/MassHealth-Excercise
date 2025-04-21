


import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import React from 'react';

interface GoogleButtonProps {
  onPress: () => void;
  text: string;
  icon?: ImageSourcePropType; // Make icon optional and accept custom image source
}

export default function GoogleButton({ 
  onPress, 
  text, 
  icon = require('../assets/googlelogo.png') // Default to Google logo
}: GoogleButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
      >
        <Image 
          source={icon}
          style={styles.icon}
        />
        <Text style={styles.text}>
          {text}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15
  },
  button: {
    height: 60,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: 'black',
    fontSize: 24,
    fontWeight: '600'
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  }
});