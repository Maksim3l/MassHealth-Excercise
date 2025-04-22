import { View, Text, StyleSheet, TextInput } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import OptionButton from '../../components/optionbutton'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DefButton from '../../components/button';
import FemaleSymbolIcon from '../../assets/female_symbol_icon';
import MaleSymbolIcon from '../../assets/male_symbol_icon';
import Input from '../../components/input';
import { router } from 'expo-router';

const UserStats = () => {
    const [age, setAge] = useState('')
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [selectedExperience, setSelectedExperience] = useState<string | null>(null);


  return (
    <View style={styles.container}>
        <SafeAreaView style={styles.safearea}>
            <View style={styles.title}>
                <Text style={styles.text}>Let's get to know you</Text>
            </View>
            <View style={styles.description}>
                <Text style={styles.subtext}>
                    Let us help u with fitness goals and nutrition.
                </Text>
            </View>
            <View style={styles.questions}>
                <Text   >
                    What Sex are you? hehehe
                </Text>
                <View style={styles.buttonRow}>
                    <OptionButton 
                        text="Male" icon={<MaleSymbolIcon height={32} width={32} stroke='red' />}
                        isSelected={selectedGender === "male"}
                        onPress={() => setSelectedGender("male")} 
                    />
                    <OptionButton 
                        text="Female" icon={<FemaleSymbolIcon height={32} width={32} />}
                        isSelected={selectedGender == "female"}
                       onPress={() => setSelectedGender("female")}
                    />
            </View>
            </View>

            <View style={styles.questions}>
                <Text   >
                    What is your age?
                </Text>
                <View style={styles.row}>
                    <Input inputStyle={{ color: '#6E49EB', fontWeight: 600 }} value={age} onChangeText={setAge} />
                <Text>years old</Text>
                </View>

            </View>


            <View style={styles.questions}>
                <Text>   
                    What is your height?
                </Text>
                <View style={styles.row}>
                    <Input inputStyle={{ color: '#6E49EB', fontWeight: 600 }} value={height} onChangeText={setHeight} />
                <Text>cm</Text>
                </View>

            </View>

            <View style={styles.questions}>
                <Text >   
                    What is your weight?
                </Text>
                <View style={styles.row}>
                    <Input inputStyle={{ color: '#6E49EB', fontWeight: 600 }} value={weight} onChangeText={setWeight} />
                <Text >kg</Text>
                </View>

            </View>

            <View style={styles.questions}>
                <Text   >
                   Do you have any previous fitness experience?
                </Text>
                <View style={styles.buttonRow}>
                    <OptionButton 
                        text="Yes" 
                        isSelected={selectedExperience === "yes"}
                        onPress={() => setSelectedExperience("yes")}
                    />
                    <OptionButton 
                        text="No" 
                        isSelected={selectedExperience === "no"}
                        onPress={() => setSelectedExperience("no")}
                    />
                </View>      
            </View>

        <View style={styles.continueButton}>
            <DefButton text="Continue" onPress={() => router.replace('/(authenticated)/home')} />
        </View>


        </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safearea: {
        flex: 1
    },
    title: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    text: {
        fontWeight: '600',
        fontSize: 32

    },
    description: {
        marginVertical: 15,
        marginHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',   
    },
    subtext: {
        fontWeight: '500',
        fontSize: 16,
        color: '#A4A4A8',

    },
    questions: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    questionText: {
        color: '#6E49EB',
    },
    buttonRow: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        marginTop: 10
    },
    continueButton: {
        marginHorizontal: 20,
        
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
        width: '100%'
    },
        
})

export default UserStats

