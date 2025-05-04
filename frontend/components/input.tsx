import { View, Text, StyleSheet, TouchableOpacity, TextInput, InputModeOptions } from 'react-native'
import React from 'react'

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  style?: object; 
  inputStyle?: object;
  inputMode?: InputModeOptions;
}

export default function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  style,
  inputStyle,
  inputMode
}: InputProps) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
         style={[styles.input, inputStyle]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        inputMode={inputMode}
        secureTextEntry={secureTextEntry}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    margin: 10,
    paddingHorizontal: 10,
    height: 50,
    justifyContent: 'center'
  },
  input: {
    fontSize: 16,
  }
})