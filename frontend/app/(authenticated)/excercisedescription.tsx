import { Video } from 'expo-av';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../assets/tsxicons/backIcon';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

const ExcercisePreview= () => {
  const { exerciseName, description, videoUrls } = useLocalSearchParams();
  const [videoData, setVideoData] = useState<any>(null);
  const videoRef = useRef(null);

  useEffect(() => {
    //console.log("Raw videoUrls:", videoUrls);
    if (videoUrls) {
      try {
        const parsed = JSON.parse(videoUrls as string);
        //console.log("Parsed video data:", parsed);
        setVideoData(parsed);
      } catch (e) {
        console.error("Failed to parse video URLs", e);
      }
    }
  }, [videoUrls]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.title}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.text}>{exerciseName}</Text>
        </View>
      </View>
      <ScrollView>
        {videoData?.side && (
          <View style={styles.videoContainer}>
            <Text style={styles.videoLabel}>Side View</Text>
            <Video
              ref={videoRef}
              source={{ uri: videoData.side }}
              useNativeControls
              style={styles.video}
            />
          </View>
        )}
        
        {videoData?.front && (
          <View style={styles.videoContainer}>
            <Text style={styles.videoLabel}>Front View</Text>
            <Video
              source={{ uri: videoData.front }}
              useNativeControls
              style={styles.video}
            />
          </View>
        )}
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>Instructions</Text>
          <Text style={styles.describe}>{description || "No instructions available for this exercise."}</Text>
        </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  title: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 24,
    color: "#6E49EB",
    fontWeight: '600',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  videoContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#6E49EB',
  },
  video: {
    width: 320,
    height: 200,
    borderRadius: 8,
  },
  descriptionContainer: {
    marginHorizontal: 20,
    padding: 20,
  },
  description: {
    fontSize: 24,
    fontWeight: '600'
  },
  describe: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'justify'
  }
});

export default ExcercisePreview;