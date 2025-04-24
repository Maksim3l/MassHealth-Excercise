import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LeafletView } from 'react-native-leaflet-view';
import { ScrollView } from 'react-native';
import RoutinesIcon from '../../../assets/routinesnavbaricon';
import SectionTitle from '../../../components/sectiontitle';
import CreateRoutineButton from '../../../components/createRoutineButton';
import Routinebutton from '../../../components/routinebutton';
import RoutinePlaceholder from '../../../components/routinePlaceholder';


const Routines: React.FC = () => {
  const router = useRouter();
  
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 46.0569,
    longitude: 14.5058
  });
  
  const locations = [
    { latitude: 46.0569, longitude: 14.5058 }, // Ljubljana
    { latitude: 46.2382, longitude: 14.3555 }, // Kranj
    { latitude: 45.5475, longitude: 13.7304 }  // Koper
  ];
  
  const navigateToMap = () => {
    router.push('../map');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.sectionTitle}>
          <RoutinesIcon color={"#6E49EB"} fill={"white"} ></RoutinesIcon>
          <Text style={styles.sectionTitleText}>Routines</Text>
        </View>
      <TouchableOpacity 
        style={styles.mapPreviewContainer}
        onPress={navigateToMap}
      >
        {/* Collapsed map view */}
        <View style={styles.mapWrapper}>
          <LeafletView
            mapCenterPosition={{
              lat: selectedLocation.latitude,
              lng: selectedLocation.longitude,
            }}
            mapLayers={[
              {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              },
            ]}
            zoom={9}
            doDebug={false}
            injectedJavaScript={`
              setTimeout(() => {
                const zoomControl = document.querySelector('.leaflet-control-zoom');
                if (zoomControl) zoomControl.style.display = 'none';
                
                // Make map non-interactive in collapsed state
                map.dragging.disable();
                map.touchZoom.disable();
                map.doubleClickZoom.disable();
                map.scrollWheelZoom.disable();
              }, 100);
            `}
          />
        </View>
        
        {/* Overlay with location text */}
        <View style={styles.mapOverlay}>
          <Text style={styles.mapLocationText}>
            Ljubljana • Kranj • Koper
          </Text>
        </View>
      </TouchableOpacity>
      
        <SectionTitle textOne='Your' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <CreateRoutineButton />
            <Routinebutton routineName='Leg day' />
            <Routinebutton routineName='Chest day' />

            <RoutinePlaceholder />
          </ScrollView>

        </View>

        <SectionTitle textOne='Popular' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <RoutinePlaceholder />
            <RoutinePlaceholder />
            <RoutinePlaceholder />
          </ScrollView>

        </View> 
        <SectionTitle textOne='Recommended' textTwo='Routines' />
        <View style={styles.buttonGroup}>
          <ScrollView horizontal={true}>
            <RoutinePlaceholder />
            <RoutinePlaceholder />
            <RoutinePlaceholder />
          </ScrollView>

        </View>


      </ScrollView>
     
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700'

  },
  sectionTitleText: {
    fontWeight: 700,
    fontSize: 32,
    color: "#6E49EB",
    margin: 10

  },
  title: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    margin: 20
  },
  mapPreviewContainer: {
    height: 120,
    margin: 15,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    alignItems: 'center',
  },
  mapLocationText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    padding: 15,
  },
  contentText: {
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row'
  }
});

export default Routines;