import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';

interface TagButtonProps {
  onPress: () => void;
  text: string;
  emoji?: string;
  color?: string;
  textColor?: string;
  selected?: boolean;
}

export default function TagButton({ 
  onPress, 
  text, 
  emoji = "👍", 
  color = "#F5F5F5", 
  textColor = "#444444",
  selected = false 
}: TagButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: color },
        selected && styles.selectedButton
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 24,
    marginHorizontal: 4,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    alignSelf: 'flex-start'
  },
  selectedButton: {
    borderColor: '#8257E9',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444444',
  },
});