import { View, Text, SafeAreaView, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import HomeIcon from '../../../assets/tsxicons/homenavbaricon';
import FireIcon from '../../../assets/tsxicons/fireicon';
import SleepIcon from '../../../assets/tsxicons/sleepicon';
import CustomDate from '../../../components/date';
import { supabase } from '../../../utils/supabase';
import CustomAlert from '../../../components/CustomAlert';  // <-- import your custom alert

const width = Dimensions.get('window').width;
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const home = () => {
  const [profile, setProfile] = useState({ name: '', username: '' });
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setCustomAlertMessage(userError.message);
        setCustomAlertVisible(true);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from('User_Metadata')
          .select('name, username')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setCustomAlertMessage(error.message);
          setCustomAlertVisible(true);
        } else {
          setProfile({ name: data.name, username: data.username });
        }
      }
    };

    fetchProfile();
  }, []);

  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Monday = 0, Sunday = 6
  const weekDates = dayNames.map((_, index) => {
    const date = new Date();
    date.setDate(today.getDate() - todayIndex + index);
    return {
      day: dayNames[index],
      dayOfMonth: date.getDate(),
      isToday: index === todayIndex,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.sectionTitle}>
          <HomeIcon color={'#6E49EB'} fill={'white'} />
          <Text style={styles.sectionTitleText}>Home</Text>
        </View>
        <View style={styles.upperRow}>
          <View style={styles.user}>
            <Text style={styles.userText}>Hello, {profile.name}</Text>
            <Text style={styles.userDate}>{today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.circle}>
            <Image
              source={require('../../../assets/placeholderprofilepic.jpg')}
              resizeMode="cover"
              style={styles.image}
            />
          </View>
        </View>

        <View style={styles.health}>
          <View style={styles.currentExerciseContainer}>
            <Text style={styles.currentExerciseText}>Health Overview</Text>
          </View>
          <View style={styles.healthsection}>
            <View style={styles.healthbox}>
              <View style={styles.iconHeader}>
                <Text style={styles.description}>Calories Burnt</Text>
                <View style={styles.iconContainer}>
                  <FireIcon />
                </View>
              </View>
              <Text style={styles.healthValue}>1.4K kCal</Text>
            </View>
            <View style={styles.healthbox}>
              <View style={styles.iconHeader}>
                <Text style={styles.description}>Time in Bed</Text>
                <View style={styles.iconContainer}>
                  <SleepIcon />
                </View>
              </View>
              <Text style={styles.healthValue}>8.5 hours</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 10 }}>
          {weekDates.map(({ day, dayOfMonth, isToday }) => (
            <CustomDate key={day} day={day} dayOfMonth={dayOfMonth} isToday={isToday} />
          ))}
        </View>
      </ScrollView>

      {/* Custom Alert Component */}
      <CustomAlert
        visible={customAlertVisible}
        title="Error"
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    position: 'relative', 
    marginTop: 10 
  },
  sectionTitle: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    alignItems: 'center' 
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10 
  },
  upperRow: {
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     marginHorizontal: 20, 
     marginTop: 20, 
     alignItems: 'center' 
    },
  user: {
     flexDirection: 'column' 
    },
  userText: {
     fontSize: 32, 
     fontWeight: '600' 
    },
  userDate: {
     fontSize: 16, 
     color: '#A4A4A8' 
    },
  circle: {
     width: 60, 
     height: 60, 
     borderRadius: 40, 
     overflow: 'hidden', 
     justifyContent: 'center', 
     alignItems: 'center', 
     backgroundColor: '#ccc' 
    },
  image: {
     width: '100%', 
     height: '100%' 
    },
  health: {
     margin: 20 
    },
  healthtitletext: {
    fontWeight: '500',
    fontSize: 24 },
  healthsection: {
     flexDirection: 'row', justifyContent: 'space-between'
    },
  healthbox: {
    width: width / 2 - 25,
    padding: 16,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A4A4A8' 
  },
  iconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap' 
  },
  description: {
    fontWeight: '500',
    fontSize: 20,
    flexShrink: 1,
    maxWidth: '75%' 
  },
  iconContainer: {
    padding: 2, 
    marginLeft: 5
     },

  healthValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5 
  },
  currentExerciseContainer: {
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#6E49EB',
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
  currentExerciseText: {
    color: 'white',
    fontSize: 20 
  },
});

export default home;
