import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

interface SectionTitleProps {
  textOne?: string;
  textTwo?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ textOne, textTwo = 'Routines' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titleFirstHalfText}>{textOne} </Text>
      <Text style={styles.titleSecondHalfText}>{textTwo}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container : {
        marginHorizontal: 20,
        marginVertical: 10,
        flexDirection: 'row'
    },
    titleFirstHalfText: {
        fontWeight: '700',
        fontSize: 32,
        color: "#6E49EB"
    },
    titleSecondHalfText: {
      fontWeight: '700',
      fontSize: 32,
    },

})

export default SectionTitle