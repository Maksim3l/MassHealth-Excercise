import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../utils/supabase';

interface PhotoData {
    uri: string;
    base64?: string;
}

export default function TwoFactorAuth() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string>('Unknown');

  const MIN_PHOTOS = 4;
  const MAX_PHOTOS = 10;
  const BASE_URL = 'http://192.168.1.137:9002';
  const VERIFICATION_ENDPOINT = `${BASE_URL}/verify_user`;
  const HEALTH_ENDPOINT = `${BASE_URL}/health`;

  useEffect(() => {
    getCurrentUser();
    checkServerHealth();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const checkServerHealth = async () => {
    try {
      console.log('Checking server health...');
      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const healthData = await response.json();
        console.log('Server health:', healthData);
        setServerStatus('Healthy');
        Alert.alert('Server Status', 'Server is running and healthy!');
      } else {
        console.log('Server responded with error:', response.status);
        setServerStatus(`Error: ${response.status}`);
        Alert.alert('Server Issue', `Server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setServerStatus('Offline');
      Alert.alert(
        'Server Offline', 
        'Cannot connect to verification server. Please check:\n\n' +
        '1. Server is running on port 9002\n' +
        '2. IP address is correct (192.168.1.137)\n' +
        '3. You\'re on the same network'
      );
    }
  };

  const takePicture = async() => {
    if(photos.length < MAX_PHOTOS && !isUploading){
        try {
            const photo = await cameraRef.current?.takePictureAsync({ 
              base64: true, 
              exif: false,
              quality: 0.8  // Reduce image size
            });

            if(photo){
                setPhotos(prevPhotos => [...prevPhotos, { 
                    uri: photo.uri,
                    base64: photo.base64 
                }]);
                console.log(`Photo ${photos.length + 1} taken successfully`);
            }
        
        } catch (error){
            console.error('Error taking photos', error);
            Alert.alert('Error', 'Error taking pic');
            setIsUploading(false);
        }
    }
  };

  const verifyUser = async () => {
    if (photos.length < MIN_PHOTOS) {
        Alert.alert('Not Enough Photos', `Please take at least ${MIN_PHOTOS} photos for verification`);
        return;
    }

    if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
    }

    try{
        const verificationPhotos = photos.slice(0, MIN_PHOTOS);

        const base64Images = verificationPhotos
            .map(photo => photo.base64)
            .filter(Boolean) as string[];

        // Check if we have valid base64 images
        if (base64Images.length !== MIN_PHOTOS) {
            Alert.alert('Error', 'Some photos are missing base64 data');
            return;
        }

        const requestBody = {
            userId: userId,
            images: base64Images,
            threshold: 0.5
        };

        console.log('Verification request:', {
            userId: userId,
            imageCount: base64Images.length,
            threshold: 0.5
        });

        const response = await fetch(VERIFICATION_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (response.ok) {
            const result = await response.json();
            console.log('Verification result:', result);
            Alert.alert(
              'Verification Successful', 
              'Your identity has been verified successfully!',
              [{ text: 'OK', onPress: () => {
                  console.log('Verification successful:', result);
              }}]
            );
        } else {
            const errorText = await response.text();
            console.error('Verification failed:', response.status, errorText);
            Alert.alert(
              'Verification Failed', 
              `Server error: ${response.status}\n${errorText}`
            );
        }

    } catch (error) {
        console.error('Verification error:', error);
        Alert.alert(
          'Connection Error', 
          `Failed to connect to server:\n${error.message || error}\n\nPlease check your network connection and server status.`
        );
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Server: {serverStatus}</Text>
        <TouchableOpacity style={styles.healthButton} onPress={checkServerHealth}>
          <Text style={styles.healthButtonText}>Check Health</Text>
        </TouchableOpacity>
      </View>

      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}>
      </CameraView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={verifyUser}>
            <Text style={styles.text}>Authenticate</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={takePicture}
        >
          <Text style={styles.text}>Take Photo ({photos.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  healthButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  healthButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 0,
    flexDirection: 'row',
    maxHeight: 64,
    margin: 16,
    gap: 10
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#6E49EB',
    paddingVertical: 12,
    borderRadius: 8,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});