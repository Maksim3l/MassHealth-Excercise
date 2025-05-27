import { useEffect, useState } from "react"
import { Platform } from "react-native";

import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';

const useHealthData = (date: Date) => {
    const [hasPermissions, setHasPermissions] = useState(false)
    const [steps, setSteps] = useState(0)
    const [flights, setFlights] = useState(0)
    const [distance, setDistance] = useState(0)
    const [sleep, setSleep] = useState(0)
    const [energy, setEnergy] = useState(0)

    const readSampleData = async () => {
    try {
      // initialize the client
      const isInitialized = await initialize();
      if (!isInitialized) {
        console.log("Health Connect not available");
        return;
      }

      // request permissions
      try {
        await requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'Distance' },
          { accessType: 'read', recordType: 'FloorsClimbed' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned'},
          { accessType: 'read', recordType: 'SleepSession'}
        ]);
      } catch (error) {
        console.error("Permission request error:", error);
        return;
      }

    // Create proper copies of the date to avoid mutation
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: startOfDay.toISOString(),
      endTime: endOfDay.toISOString(),
    };

    // Reset all values before fetching new data
    setSteps(0);
    setFlights(0);
    setDistance(0);
    setEnergy(0);
    setSleep(0);

    // Steps with error handling
    try {
      const steps = await readRecords('Steps', { timeRangeFilter });
      if (steps && steps.records && steps.records.length > 0) {
        const totalSteps = steps.records.reduce((sum, cur) => sum + cur.count, 0);
        setSteps(totalSteps);
      }
    } catch (stepError) {
      console.error("Error reading steps:", stepError);
    }

    // Distance with error handling
    try {
      const distance = await readRecords('Distance', { timeRangeFilter });
      if (distance && distance.records && distance.records.length > 0) {
        const totalDistance = distance.records.reduce(
          (sum, cur) => sum + cur.distance.inMeters,
          0
        );
        setDistance(totalDistance);
      }
    } catch (distanceError) {
      console.error("Error reading distance:", distanceError);
    }

    // Floors with error handling
    try {
      const floorsClimbed = await readRecords('FloorsClimbed', { timeRangeFilter });
      if (floorsClimbed && floorsClimbed.records && floorsClimbed.records.length > 0) {
        const totalFloors = floorsClimbed.records.reduce((sum, cur) => sum + cur.floors, 0);
        setFlights(totalFloors);
      }
    } catch (floorError) {
      console.error("Error reading floors:", floorError);
    }

    try{
      const hoursSlept = await readRecords('SleepSession', { timeRangeFilter});
      if (hoursSlept && hoursSlept.records && hoursSlept.records.length > 0) {
        const totalHoursSlept = hoursSlept.records.reduce((sum, cur) => {
          const startTime = new Date(cur.startTime).getTime();
          const endTime = new Date(cur.endTime).getTime();
          const durationHours = (endTime - startTime) / (1000 * 60 * 60); // Convert ms to hours
          return sum + durationHours;
        }, 0);
        setSleep(totalHoursSlept);
      }
    } catch(sleepError) {
        console.error("Error reading sleep:", sleepError);
    }

    try{
      const caloriesBurned = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
      if (caloriesBurned && caloriesBurned.records && caloriesBurned.records.length > 0) {
        const totalCalories = caloriesBurned.records.reduce((sum, cur) => {
          return sum + cur.energy.inKilocalories;
        }, 0);
        setEnergy(totalCalories);
      }
    } catch(calorieError) {
        console.error("Error reading calories burned:", calorieError);
    }
  } catch (error) {
    console.error("Error in readSampleData:", error);
  }
};

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    readSampleData();
  }, [date]); // This will trigger whenever the date changes

    const debugHealthConnect = async () => {
      try {
        //console.log("=== HEALTH CONNECT DEBUG ===");
        
        // 1. Check initialization
        const isInitialized = await initialize();
        //console.log("Health Connect initialized:", isInitialized);
        if (!isInitialized) return;
        
        // 2. Check permissions
        //console.log("Checking permissions...");
        try {
          const grantedPermissions = await requestPermission([
            { accessType: 'read', recordType: 'Steps' },
            { accessType: 'read', recordType: 'Distance' },
            { accessType: 'read', recordType: 'FloorsClimbed' },
            { accessType: 'read', recordType: 'ActiveCaloriesBurned'},
            { accessType: 'read', recordType: 'SleepSession'}
          ]);
          //console.log("Permissions granted:", JSON.stringify(grantedPermissions));
        } catch (permError) {
          console.error("Permission error:", permError);
        }
        
        // 3. Check for ANY data (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const wideTimeRange: TimeRangeFilter = {
          operator: 'between' as const,
          startTime: threeMonthsAgo.toISOString(),
          endTime: new Date().toISOString(),
        };
        
        //console.log("Checking for ANY data in the last 3 months");
        
        // Steps
        try {
          const steps = await readRecords('Steps', { timeRangeFilter: wideTimeRange });
          //console.log("Steps records found:", steps.records ? steps.records.length : 0);
          if (steps.records && steps.records.length > 0) {
            //console.log("First step record:", JSON.stringify(steps.records[0]));
          }
        } catch (e) {
          //console.error("Steps check error:", e);
        }
        
        //console.log("=== DEBUG COMPLETE ===");
      } catch (error) {
        console.error("Debug error:", error);
      }
    };

    // Always return all values, including sleep and energy
    return { 
      steps: steps || 0, 
      flights: flights || 0, 
      distance: distance || 0,
      sleep: sleep || 0,
      energy: energy || 0
    }
}

export default useHealthData;