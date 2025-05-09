import { View, Text, SafeAreaView, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import ProfileIcon from '../../../assets/tsxicons/profilenavbaricon';
import SaveIcon from '../../../assets/tsxicons/saveicon';
import LogoutIcon from '../../../assets/tsxicons/logout';
import { supabase } from '../../../utils/supabase';
import { router } from 'expo-router';


const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    Alert.alert('Error', error.message)
  } else {
    router.replace('../../login')
  }
}


const Profile = () => {
  const [profile, setProfile] = useState({ name: '', username: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        Alert.alert('Error', userError.message);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from('User_Metadata')
          .select('name, username')
          .eq('user_id', user.id)
          .single();

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          setProfile({ name: data.name, username: data.username });
        }
      }
    };

    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ProfileIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Profile</Text>
      </View>
      <View style={styles.upperRow}>
        <View style={styles.circle}>
          <Image
            source={require('../../../assets/placeholderprofilepic.jpg')}
            resizeMode='cover'
            style={styles.image}
          />
        </View>
        <Text style={styles.nameofuser}>{profile.name }</Text>
        <Text style={styles.username}>{profile.username}</Text>


      </View>

      <View style={styles.subsectiontitle}>
        <Text style={styles.subsectiontitletext}>Content</Text>
        <TouchableOpacity style={styles.option}>
          <SaveIcon height={24} width={24} strokeColor={"#6E49EB"} />
          <View style={styles.optiontitle}>
          <Text style={styles.optiontext}>Favorites</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.subsectiontitle}>
        <Text style={styles.subsectiontitletext}>Perferences</Text>
        <TouchableOpacity style={styles.option} onPress={signOut}>
          <LogoutIcon stroke="#6E49EB" strokeWidth={18} width={24} height={24} fillColor="none" />
          <View style={styles.optiontitle}>
            <Text style={styles.optiontext}>Logout</Text>
            </View>
        </TouchableOpacity>
      </View>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700',
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10,
  },
  upperRow: {
    marginHorizontal: width * 0.02,
    marginVertical: height * 0.01,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  circle: {
    width: 120,           
    height: 120,
    borderRadius: 70,  
    overflow: 'hidden',   
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc', 
    margin: 10
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nameofuser: {
    fontSize: width > 600 ? 20 : 16,
    fontWeight: '600'
  },
  username: {
    fontSize: width > 600 ? 18 : 14,
    color: '#A4A4A8'
  },
  subsectiontitle: {
  },
  subsectiontitletext: {
    fontSize: width > 600 ? 18 : 14,
    color: '#A4A4A8',
    fontWeight: '500',
    margin: 10
  },
  option: {
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  optiontitle: {
    margin: 10,
  },
  optiontext: {
    fontSize: 16,
    fontWeight: '500'
  }
});

export default Profile;