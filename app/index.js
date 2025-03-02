import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}> 
        <Image source={require("../images/dumbell.png")} style={styles.image}/>
        <Text style={styles.title}>Spremeni svoj življenski slog zdaj</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Prijava</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/singup")}>
          <Text style={styles.buttonText}>Registracija</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#B069DB",
    alignItems: "center",
  },
  image: {
    marginBottom: 50,
    height: 300,
    width: 400
  },

  title: {
    fontSize: 30,
    margin: 20,
    textAlign: 'center',
    color: 'black',
    fontWeight: '700',
  },
  button: {
    backgroundColor: 'black',
    marginBottom: 10,
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
