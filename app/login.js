import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import  LoginForm  from "../components/LoginForm"

export default function login() {
  return (
      <SafeAreaView style={styles.container}> 
        <LoginForm />
      </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#B069DB", 
  },
})
