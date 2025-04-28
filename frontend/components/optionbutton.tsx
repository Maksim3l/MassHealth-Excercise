import { View, Text, TouchableOpacity, StyleSheet, ImageSourcePropType, Image, Pressable } from 'react-native'
import React, { useState } from 'react'

interface OptionButtonProps {
    onPress: () => void;
    text: string;
    icon?: React.ReactNode;
    isSelected?: boolean;
  }
  
  const OptionButton: React.FC<OptionButtonProps> = ({ 
    onPress, 
    text, 
    icon, 
    isSelected = false 
  }) => {
    const [isPressed, setPressed] = useState(false);
    
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.button, 
          isPressed && styles.buttonPressed,
          isSelected && styles.buttonPressed
        ]}
      >
        <View style={styles.content}>
            {icon && <View>{icon}</View>}
            <Text style={[styles.buttonText, isSelected && styles.selectedText]}>
            {text}
            </Text>
        </View>
      </Pressable>
    );
  }

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    margin: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 24
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  buttonPressed: {
    borderRadius: 16,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderWidth: 1,
    backgroundColor: "#6E49EB",
    alignSelf: 'flex-start',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    margin: 5,
  },
  selectedText: {
    color: 'white'
  }
})

export default OptionButton