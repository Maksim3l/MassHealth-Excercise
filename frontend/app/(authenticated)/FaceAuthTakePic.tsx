import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';

interface PhotoData {
    uri: string,
}

export default function FaceAuthTakePic() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  const MIN_PHOTOS = 4;
  const MAX_PHOTOS = 10;

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getUserId();
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
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

  // taking photo
  const takePicture = async() => {
    if(photos.length < MAX_PHOTOS){
        try{
            const photo = await cameraRef.current?.takePictureAsync({ base64: true, exif: false});

            if(photo){
              setPhotos(prevPhotos => [...prevPhotos, { uri: photo.uri }]);
            }
        } catch (error){
            console.error('Error taking photos', error);
            Alert.alert('Error', 'Error taking pic');
        }
    } else {
      Alert.alert('Maximum photos', `You can only take ${MAX_PHOTOS} photos.`);
    }
  }
  
  // Upload all stored photos
  const uploadAllPhotos = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }
    
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Not enough photos', `Please take at least ${MIN_PHOTOS} photos.`);
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload each photo
      for (let i = 0; i < photos.length; i++) {
        const photoNumber = i + 1;
        const response = await fetch(photos[i].uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        
        const fileName = `${userId}/slika${photoNumber}.jpg`;
        const {error} = await supabase
            .storage
            .from('images')
            .upload(fileName, arrayBuffer, {contentType: 'image/jpeg', upsert: true});
            
        if (error) {
          console.error('Error uploading image', error);
          throw error;
        }
      }
      
      // Enable 2FA in database
      await supabase
        .from('User_Metadata')
        .update({ '2FA': true })
        .eq('user_id', userId);
      
      Alert.alert(
        'Success', 
        `${photos.length} photos uploaded successfully. 2FA has been enabled.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(authenticated)/(tabs)/profile')
          }
        ]
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Upload Error', 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.photoCounter}>
        <Text style={styles.photoCounterText}>
          {photos.length} of {MAX_PHOTOS} photos taken
          {photos.length < MIN_PHOTOS && ` (minimum ${MIN_PHOTOS} required)`}
        </Text>
      </View>
      
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}>
      </CameraView>
      
      <View style={styles.buttonContainer}>
        {photos.length >= MIN_PHOTOS ? (
          // Show Upload button when enough photos are taken
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton, isUploading && styles.disabledButton]} 
            onPress={uploadAllPhotos}
            disabled={isUploading}
          >
            <Text style={styles.text}>
              {isUploading ? 'Uploading...' : `Upload ${photos.length} Photos`}
            </Text>
          </TouchableOpacity>
        ) : (
          // Show Flip Camera button otherwise
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.button, 
            (photos.length >= MAX_PHOTOS || isUploading) && styles.disabledButton
          ]} 
          onPress={takePicture}
          disabled={photos.length >= MAX_PHOTOS || isUploading}
        >
          <Text style={styles.text}>
            {isUploading ? 'Uploading...' : `Take Photo (${photos.length}/${MAX_PHOTOS})`}
          </Text>
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
  camera: {
    flex: 1,
  },
  photoCounter: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    alignItems: 'center',
  },
  photoCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flex: 0,
    flexDirection: 'row',
    maxHeight: 64,
    margin: 16,
    gap: 10
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6E49EB',
    padding: 10,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: '#28a745', 
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
