import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
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

  const MIN_PHOTOS = 4;
  const MAX_PHOTOS = 10;




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

  const takePicture = async() => {
    if(photos.length < MAX_PHOTOS){
        try{
            const photo = await cameraRef.current?.takePictureAsync({ base64: true, exif: false});
            //console.log("photo", photo)

            if(photo){
              const PhotoNumber = photos.length + 1;
              setPhotos(prevPhotos => [...prevPhotos, { uri: photo.uri }]);
              setIsUploading(true);
              uploadImage(photo.uri, PhotoNumber)
              setIsUploading(false);
            }
        
        } catch (error){
            console.error('Error taking photos', error);
            Alert.alert('Error', 'Error taking pic');
            setIsUploading(false);
        }

    } else {
      
    }

    
  }
  const uploadImage = async (uri: string, photoNumber: number) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        console.log("arrayBuffer", arrayBuffer.byteLength);
        const fileName = `${userId}/slika${photoNumber}.jpg`;
        const {error} = await supabase
            .storage
            .from('images')
            .upload(fileName, arrayBuffer, {contentType: 'image/jpeg', upsert: false})
        if (error) {
            console.error('Error uploading image', error)
        }
    }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}>
      </CameraView>
      <View style={styles.buttonContainer}>
 
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.button, 
                (photos.length >= MAX_PHOTOS || isUploading) && styles.disabledButton
              ]} 
              onPress={takePicture}
              disabled={photos.length >= MAX_PHOTOS || isUploading}
            >
              <Text style={styles.text}>
                {isUploading ? 'Uploading...' : 'Take a photo'}
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
    backgroundColor: '#6E49EB',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
