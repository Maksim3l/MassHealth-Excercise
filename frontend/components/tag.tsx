import React, { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

interface TagButtonProps {
  onPress?: () => void;
  text: string;
  textSize?: string;
}

const TagButton: React.FC<TagButtonProps> = ({ onPress, text, textSize = '16' }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(prev => !prev);
    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable 
      style={[
        styles.button,
        isPressed ? styles.buttonPressed : null
      ]}
      onPress={handlePress}
    >
      <Text 
        style={[
          styles.buttonText,
          { fontSize: parseInt(textSize, 10) },
          isPressed ? styles.buttonTextPressed : null
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#A4A4A8',
    margin: 5,
  },
  buttonPressed: {
    backgroundColor: '#6E49EB',
  },
  buttonText: {
    color: '#6E49EB',
    fontWeight: 'bold',
  },
  buttonTextPressed: {
    color: 'white',
  },
});

export default TagButton;
