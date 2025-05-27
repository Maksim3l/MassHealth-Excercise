import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import OptionButton from '../../components/optionbutton'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DefButton from '../../components/button';
import FemaleSymbolIcon from '../../assets/tsxicons/female_symbol_icon';
import MaleSymbolIcon from '../../assets/tsxicons/male_symbol_icon';
import Input from '../../components/input';
import { router } from 'expo-router';
import { Session } from '@supabase/supabase-js'
import { supabase } from '../../utils/supabase';

const UserStats = () => {
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [selectedExperience, setSelectedExperience] = useState<Boolean | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false); 


    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.replace('/login');
            } else {
                setSession(session);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.replace('/login');
            } else {
                setSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // If no session, show nothing (will redirect)
    if (!session) {
        return null;
    }

    const handleContinue = async () => {
        if (!selectedGender || !age || !weight || selectedExperience === null) {
            Alert.alert("Error", "Fill in all fields");
            return;
        }
    
        setLoading(true);
    
        try {
            const { error } = await supabase
                .from('User_Metadata')
                .upsert([{
                    user_id: session?.user?.id,
                    gender: selectedGender,
                    age: parseInt(age),
                    height: parseInt(height),
                    weight: parseInt(weight),
                    fitness_experience: selectedExperience === true
                }], { onConflict: 'user_id' });
    
            if (error) throw error;
    
            router.push('/(tabs)/home');
        } catch (error) {
            Alert.alert('Error ', (error as Error).message || "Failed to load user stats");
        } finally {
            setLoading(false);
        }
    };
    
    


  return (
        <SafeAreaView style={styles.safearea}>
            <View style={styles.title}>
                <Text style={styles.text}>Let's get to know you</Text>
            </View>
            <View style={styles.description}>
                <Text style={styles.subtext}>
                    Let us help u with fitness goals and nutrition.
                </Text>
            </View>
            <ScrollView>

            <View style={styles.questions}>
                <Text   >
                    What Sex are you?
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
                        isSelected={selectedExperience === true}
                        onPress={() => setSelectedExperience(true)}
                    />
                    <OptionButton 
                        text="No" 
                        isSelected={selectedExperience === false}
                        onPress={() => setSelectedExperience(false)}
                    />
                </View>
                      
            </View>
            </ScrollView>

        <View style={styles.continueButton}>
            <DefButton text="Continue" onPress={() => handleContinue()} />
        </View>
    
        </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
        marginVertical: 10,
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





