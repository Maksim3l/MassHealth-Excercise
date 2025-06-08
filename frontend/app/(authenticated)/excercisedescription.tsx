import React, { useEffect, useState, useRef } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context'; 
import BackIcon from '../../assets/tsxicons/backIcon'; 
import { router } from 'expo-router'; 
import { useLocalSearchParams } from 'expo-router'; 
import { ScrollView } from 'react-native';
import WebView from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'; // Add this import

const { width } = Dimensions.get('window');
const videoWidth = Math.min(320, width - 40); 
const videoHeight = videoWidth * 0.6; 

const ExcercisePreview = () => {   
  const params = useLocalSearchParams();
  const { exerciseName, description, videoUrls } = params;
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainVideoUrl, setMainVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<string>('');
  const [videoLoading, setVideoLoading] = useState(true);
  const [refresh, setRefresh] = useState(0); // Add refresh counter

  // Initialize player with the first video
  const player = useVideoPlayer(
    mainVideoUrl ? { uri: `${mainVideoUrl}?t=${refresh}` } : null, // Add refresh parameter to force reload
    (player) => {
      player.loop = true;
      player.play();
    }
  );

  // Add loading timeout effect - reduced to 2 seconds for better UX
  useEffect(() => {
    if (mainVideoUrl) {
      setVideoLoading(true);
      
      const timer = setTimeout(() => {
        setVideoLoading(false);
      }, 2000);  // Reduced from 4s to 2s
      
      return () => clearTimeout(timer);
    }
  }, [mainVideoUrl, refresh]); // Include refresh in dependencies

  // Add a refresh handler
  const handleRefresh = () => {
    setVideoLoading(true);
    setRefresh(prev => prev + 1); // Increment refresh counter to force video reload
    
    
  };

  const isYouTubeUrl = (url: string): boolean => {
    return !!url && (
      url.includes('youtube.com') || 
      url.includes('youtu.be') || 
      url.includes('youtube-nocookie.com')
    );
  };

  const isVimeoUrl = (url: string): boolean => {
    return !!url && (
      url.includes('vimeo.com') || 
      url.includes('player.vimeo.com')
    );
  };

  useEffect(() => {
    if (videoUrls) {
      try {
        let parsed;
        
        if (typeof videoUrls === 'string') {
          parsed = JSON.parse(videoUrls);
        } else if (typeof videoUrls === 'object') {
          parsed = videoUrls;
        } else {
          parsed = null;
        }
        
        if (parsed) {
          setVideoData(parsed);
          
          // Get the first regular video URL prioritizing front, then side, then other
          const preferredOrder = ['front', 'side', 'other'];
          let foundVideo = false;
          
          // Try to find a video in the preferred order
          for (const key of preferredOrder) {
            if (parsed[key] && typeof parsed[key] === 'string') {
              console.log(`Using ${key} video:`, parsed[key]);
              setMainVideoUrl(parsed[key]);
              setVideoType(key);
              foundVideo = true;
              break;
            }
          }
          
          // If no video found in preferred order, use any available video
          if (!foundVideo) {
            const keys = Object.keys(parsed);
            for (const key of keys) {
              const url = parsed[key];
              if (url && typeof url === 'string') {
                console.log(`Using ${key} video:`, url);
                setMainVideoUrl(url);
                setVideoType(key);
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse video URLs", e);
      }
    }
    
    setLoading(false);
  }, [videoUrls]);

  // Function to extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    let videoId = null;
    
    if (url.includes('youtu.be/')) {
      const splitUrl = url.split('youtu.be/')[1];
      videoId = splitUrl.split('?')[0];
    } 
    else if (url.includes('youtube.com/watch')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v');
      } catch (e) {
        console.error("Error parsing YouTube watch URL:", e);
      }
    } 
    else if (url.includes('/embed/')) {
      const splitUrl = url.split('/embed/')[1];
      videoId = splitUrl.split('?')[0];
    }
    
    return videoId;
  };

  const getVimeoVideoId = (url: string): string | null => {
    if (!url) return null;
    
    let videoId = null;
    
    if (url.includes('player.vimeo.com/video/')) {
      const matches = url.match(/player\.vimeo\.com\/video\/(\d+)/);
      if (matches && matches[1]) {
        videoId = matches[1];
      }
    } 
    else if (url.includes('vimeo.com/')) {
      const matches = url.match(/vimeo\.com\/(\d+)/);
      if (matches && matches[1]) {
        videoId = matches[1];
      }
    }
    
    if (videoId && videoId.includes('?')) {
      videoId = videoId.split('?')[0];
    }
    
    return videoId;
  };

  // Render YouTube video
  const renderYouTubeVideo = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    
    if (!videoId) {
      return (
        <View style={styles.videoError}>
          <Text style={styles.videoErrorText}>Invalid YouTube URL</Text>
        </View>
      );
    }
    
    // Add a cache-busting parameter to force refresh
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0&showinfo=0&controls=1&t=${refresh}`;
    
    return (
      <WebView
        style={{ width: videoWidth, height: videoHeight, borderRadius: 8 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        source={{ 
          uri: embedUrl,
          headers: {
            'Referer': 'https://masshealth-exercise.app'
          } 
        }}
        allowsFullscreenVideo={true}
        onLoadStart={() => setVideoLoading(true)}
        onLoadEnd={() => setVideoLoading(false)}
        originWhitelist={['*']}
        startInLoadingState={true}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={true}
      />
    );
  };

  // Render Vimeo video
  const renderVimeoVideo = (url: string) => {
    const videoId = getVimeoVideoId(url);
    
    if (!videoId) {
      return (
        <View style={styles.videoError}>
          <Text style={styles.videoErrorText}>Invalid Vimeo URL</Text>
        </View>
      );
    }
    
    // Add a cache-busting parameter to force refresh
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0&t=${refresh}&app_id=masshealth`;
    
    return (
      <WebView
        style={{ width: videoWidth, height: videoHeight, borderRadius: 8 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        source={{ 
          uri: embedUrl,
          headers: {
            'Referer': 'https://masshealth-exercise.app'
          } 
        }}
        allowsFullscreenVideo={true}
        onLoadStart={() => setVideoLoading(true)}
        onLoadEnd={() => setVideoLoading(false)}
        originWhitelist={['*']}
        startInLoadingState={true}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={true}
      />
    );
  };

  const renderMainVideo = () => {
    if (!mainVideoUrl) {
      return (
        <View style={styles.videoError}>
          <Text style={styles.videoErrorText}>No video available</Text>
        </View>
      );
    }
    
    let label = videoType === 'other' ? 'Exercise Video' : 
               `${videoType.charAt(0).toUpperCase() + videoType.slice(1)} View`;
    
    return (
      <View style={styles.videoContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.videoLabel}>{label}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>↻ Reload</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.videoWrapper}>
          {videoLoading && (
            <View style={styles.videoLoadingOverlay}>
              <ActivityIndicator size="large" color="#6E49EB" />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}
          
          {isYouTubeUrl(mainVideoUrl) 
            ? renderYouTubeVideo(mainVideoUrl)
            : isVimeoUrl(mainVideoUrl) 
              ? renderVimeoVideo(mainVideoUrl)
              : <VideoView 
                  style={styles.vwVideo}  
                  player={player}
                  allowsFullscreen
                  allowsPictureInPicture
                />
          }
        </View>
      </View>
    );
  };

  // Render instructions
  const renderInstructions = () => {
    if (!description) {
      return (
        <View style={styles.emptyInstructions}>
          <Ionicons name="information-circle-outline" size={32} color="#6E49EB" />
          <Text style={styles.emptyInstructionsText}>No instructions available for this exercise.</Text>
        </View>
      );
    }

    // Check if description has numbered steps (e.g., "1. Do this 2. Do that")
    const hasNumberedSteps = /\d+\.\s/.test(description as string);
    
    if (hasNumberedSteps) {
      // Split by numbered steps
      const steps = (description as string).split(/(\d+\.\s)/).filter(Boolean);
      const formattedSteps = [];
      
      for (let i = 0; i < steps.length; i += 2) {
        if (i + 1 < steps.length) {
          formattedSteps.push({
            number: steps[i].trim(),
            text: steps[i + 1].trim()
          });
        }
      }
      
      return (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="list" size={24} color="#6E49EB" />
            <Text style={styles.instructionsTitle}>Instructions</Text>
          </View>
          
          {formattedSteps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      );
    }
    
    // Regular paragraph format
    return (
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionsHeader}>
          <Ionicons name="information-circle" size={24} color="#6E49EB" />
          <Text style={styles.instructionsTitle}>Instructions</Text>
        </View>
        <Text style={styles.instructionsText}>{description as string}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.title}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text numberOfLines={2} style={styles.text}>{exerciseName as string}</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6E49EB" />
            <Text style={styles.loadingText}>Loading exercise data...</Text>
          </View>
        ) : (
          renderMainVideo()
        )}
        
        <View style={styles.descriptionContainer}>
          {renderInstructions()}
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
    flexWrap: 'wrap',
    maxWidth: 220
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
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: Dimensions.get("window").width * 0.9,
    marginBottom: 5,
  },
  refreshButton: {
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  refreshText: {
    color: '#6E49EB',
    fontWeight: '500',
    fontSize: 14,
    marginHorizontal: 20
  },
  videoWrapper: {
    position: 'relative',
    width: Dimensions.get("window").width * 0.9,
    height: 170,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 8,
  },
  videoLoadingText: {
    color: 'white',
    marginTop: 10,
    
  },
  videoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6E49EB',
    marginHorizontal: 20
  },
  videoError: {
    width: videoWidth,
    height: videoHeight,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorText: {
    color: '#6E49EB',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  instructionsContainer: {
    backgroundColor: '#f9f6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#6E49EB20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e0ff',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e0ff',
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6E49EB',
    marginLeft: 10,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6E49EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  emptyInstructions: {
    backgroundColor: '#f9f6ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 120,
  },
  emptyInstructionsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  vwVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});

export default ExcercisePreview;