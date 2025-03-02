import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Link, TouchableOpacity, Alert } from 'react-native';
import { EvilIcons } from '@expo/vector-icons';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        
    }
    return (
        <View style={styles.login}>
            <View style={styles.input}>
                <EvilIcons name='user' size={32} color="#333" style={styles.icon} />
                <TextInput
                    style={styles.textInput}
                    placeholder="Uporabniško ime"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#333"
                />
            </View>

            <View style={styles.input}>
                <EvilIcons name='lock' size={32} color="#333" style={styles.icon} />
                <TextInput
                    style={styles.textInput}
                    placeholder="Geslo"
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#333"
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                <Text style={styles.buttonText}>Prijava</Text>
            </TouchableOpacity>

                <Text style={styles.registerText}>Not registered? Sign Up</Text>

            
        </View>
    );
};

const styles = StyleSheet.create({
    login: {
        width: '80%',
        backgroundColor: '#FAFAFA',
        margin: 20,
        padding: 20,
        borderRadius: 20,
    },
    input: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        paddingLeft: 10,
        paddingBottom: 12,
        paddingTop: 12,
        borderRadius: 15,
    },
    icon: {
        paddingRight: 7,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
        color: '#333',
    },
    button: {
        backgroundColor: '#B069DB',
        paddingVertical: 17,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
        margin: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    registerText: {
        margin: 15,
        fontSize: 14,
        color: '#B07E9B',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    link: {}
});

export default LoginForm;
