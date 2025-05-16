import { Video } from 'expo-av'; 
import React, { useEffect, useState, useRef, RefObject } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context'; 
import BackIcon from '../../assets/tsxicons/backIcon'; 
import { router } from 'expo-router'; 
import { useLocalSearchParams } from 'expo-router'; 
import { ScrollView } from 'react-native';
import WebView from 'react-native-webview';

const { width } = Dimensions.get('window');
const videoWidth = Math.min(320, width - 40); 
const videoHeight = videoWidth * 0.6; 

// Define a type for video refs to allow string indexing
type VideoRefs = {
  [key: string]: RefObject<any>;
};

const ExcercisePreview = () => {   
  const params = useLocalSearchParams();
  const { exerciseName, description, videoUrls } = params;
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Define videoRefs with proper typing for string indexing
  const videoRefs: VideoRefs = {
    side: useRef(null),
    front: useRef(null),
    other: useRef(null)
  };

  const isYouTubeUrl = (url: string): boolean => {
    const result = !!url && (
      url.includes('youtube.com') || 
      url.includes('youtu.be') || 
      url.includes('youtube-nocookie.com')
    );
    //console.log(`Checking if URL is YouTube: ${url} => ${result}`);
    return result;
  };

  const isVimeoUrl = (url: string): boolean => {
    const result = !!url && (
      url.includes('vimeo.com') || 
      url.includes('player.vimeo.com')
    );
    //console.log(`Checking if URL is Vimeo: ${url} => ${result}`);
    return result;
  };

  // Function to extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    let videoId = null;
    
    // youtu.be/VIDEO_ID format
    if (url.includes('youtu.be/')) {
      const splitUrl = url.split('youtu.be/')[1];
      videoId = splitUrl.split('?')[0];
    } 
    // youtube.com/watch?v=VIDEO_ID format
    else if (url.includes('youtube.com/watch')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v');
      } catch (e) {
        console.error("Error parsing YouTube watch URL:", e);
      }
    } 
    // youtube.com/embed/VIDEO_ID format
    else if (url.includes('/embed/')) {
      const splitUrl = url.split('/embed/')[1];
      videoId = splitUrl.split('?')[0];
    }
    
    return videoId;
  };

  const getVimeoVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different Vimeo URL formats
    let videoId = null;
    
    // Extract ID from any Vimeo URL format
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
        }
      } catch (e) {
        console.error("Failed to parse video URLs", e);
      }
    }
    
    setLoading(false);
  }, [videoUrls]);

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
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0&showinfo=0&controls=1`;
    
    return (
      <WebView
        style={{ width: videoWidth, height: videoHeight, borderRadius: 8 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        source={{ uri: embedUrl }}
        allowsFullscreenVideo={true}
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
    
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`;
    
    return (
      <WebView
        style={{ width: videoWidth, height: videoHeight, borderRadius: 8 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        source={{ uri: embedUrl }}
        allowsFullscreenVideo={true}
      />
    );
  };

  // Render regular video with expo-av
  const renderNormalVideo = (url: string, videoRef: RefObject<any>) => {
    return (
      <Video
        ref={videoRef}
        source={{ uri: url }}
        useNativeControls
        style={styles.video}
      />
    );
  };

  // Dynamically get or create a ref for a view type
  const getVideoRef = (viewType: string): RefObject<any> => {
    if (videoRefs[viewType]) {
      return videoRefs[viewType];
    }
    
    videoRefs[viewType] = useRef(null);
    return videoRefs[viewType];
  };

  const renderVideoContainer = (viewType: string, url: string | undefined) => {
    if (!url) return null;
    
    let label = viewType === 'other' ? 'Exercise Video' : `${viewType.charAt(0).toUpperCase() + viewType.slice(1)} View`;
    
    const videoRef = getVideoRef(viewType);
    
    return (
      <View style={styles.videoContainer} key={viewType}>
        <Text style={styles.videoLabel}>{label}</Text>
        {isYouTubeUrl(url) 
          ? renderYouTubeVideo(url)
          : isVimeoUrl(url) 
            ? renderVimeoVideo(url)
            : renderNormalVideo(url, videoRef)
        }
      </View>
    );
  };

  const hasVideos = videoData && Object.keys(videoData).some(key => Boolean(videoData[key]));

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
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        ) : hasVideos ? (
          // Render all available videos
          <>
            {videoData.front && renderVideoContainer('front', videoData.front)}
            {videoData.side && renderVideoContainer('side', videoData.side)}
            {videoData.other && renderVideoContainer('other', videoData.other)}
            {Object.keys(videoData).filter(key => !['front', 'side', 'other'].includes(key)).map(key => 
              renderVideoContainer(key, videoData[key])
            )}
          </>
        ) : (
          <View style={styles.videoContainer}>
            <View style={styles.videoError}>
              <Text style={styles.videoErrorText}>No videos available for this exercise</Text>
            </View>
          </View>
        )}
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>Instructions</Text>
          <Text style={styles.describe}>{description as string || "No instructions available for this exercise."}</Text>
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
  videoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#6E49EB',
  },
  video: {
    width: videoWidth,
    height: videoHeight,
    borderRadius: 8,
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default ExcercisePreview;