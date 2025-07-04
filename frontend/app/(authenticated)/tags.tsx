import { SafeAreaView, View, StyleSheet, Text } from "react-native"
import TagButton from "../../components/tag";
import DefButton from "../../components/button";
import { router } from "expo-router";


const Tags = () => {

  return(
          <SafeAreaView style={styles.container}>

              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  What are your fitness goals
                </Text>
                <Text style={styles.text}>
                  Choose between 3 or more topics that apply to your fitness goals?
                </Text>
              </View>

          
              <View style={styles.buttonsContainer}>
                  <TagButton  onPress={() => console.log("not")} text={"Great Health"}>
                  </TagButton>

                  <TagButton onPress={() => console.log("not")} text={"Athlete Waters"}>
                  </TagButton>

                  <TagButton onPress={() => console.log("not")} text={"Great Body"}>
                  </TagButton>
            </View>

            <DefButton onPress={() => router.push('/userstats')} text={"Continue!"}>
              
            </DefButton>
          </SafeAreaView>   
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
    margin: 20

  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    color: '#333',
    fontSize: 32,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center', 
    width: '100%',      
  },
  text: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 60,
    width: '90%',       
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }



});

export default Tags