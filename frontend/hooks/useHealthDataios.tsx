import { useEffect, useState } from "react"
import BrokenHealthKit, { HealthInputOptions, HealthKitPermissions, HealthUnit } from "react-native-health";

const NativeModules = require("react-native").NativeModules;
const AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit;
AppleHealthKit.Constants = BrokenHealthKit.Constants;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.SleepAnalysis
    ],
    write: []
  }
}

const useHealthDataios = (date: Date) => {
  const [hasPermissions, setHasPermissions] = useState(false)
  const [steps, setSteps] = useState(0)
  const [flights, setFlights] = useState(0)
  const [distance, setDistance] = useState(0)
  const [calories, setCalories] = useState(0)
  const [sleepingHours, setSleepingHours] = useState(0)

  useEffect(() => {
    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) {
        console.log("Error getting permissions");
        return;
      }
      setHasPermissions(true)
    })
  }, [])

  useEffect(() => {
    if (!hasPermissions) {
      return;
    }

    // Reset values before fetching new data
    setSteps(0);
    setFlights(0);
    setDistance(0);
    setSleepingHours(0);
    setCalories(0);

    // For simple daily metrics (steps, flights, distance) - use date option
    const dailyOptions: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };

    // For time-series data (calories, sleep) - use startDate/endDate
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const timeRangeOptions = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      includeManuallyAdded: false,
    };

    // These work with daily options (single data point per day)
    AppleHealthKit.getStepCount(dailyOptions, (err, result) => {
      if (err) {
        console.log("Error getting steps")
        return
      }
      console.log('Steps for', date.toDateString(), ':', result.value)
      setSteps(result.value)
    })

    AppleHealthKit.getFlightsClimbed(dailyOptions, (err, result) => {
      if (err) {
        console.log("Error getting flights climbed")
        return
      }
      console.log('Flights for', date.toDateString(), ':', result.value)
      setFlights(result.value)
    })

    AppleHealthKit.getDistanceWalkingRunning(dailyOptions, (err, result) => {
      if (err) {
        console.log("Error getting distance")
        return
      }
      console.log('Distance for', date.toDateString(), ':', result.value)
      setDistance(result.value)
    })

    // These need time range options (multiple samples per day)
    AppleHealthKit.getActiveEnergyBurned(timeRangeOptions, (err, result) => {
      if (err) {
        console.log("Error getting active energy burned:", err);
        return;
      }
      
      console.log('Raw calories data:', result);
      
      if (result && Array.isArray(result) && result.length > 0) {
        let totalCalories = 0;
        
        result.forEach(sample => {
          // HealthKit returns calories as { value: number, unit: string }
          if (sample && typeof sample.value === 'number') {
            totalCalories += sample.value;
          }
        });
        
        console.log('Total calories burned for', date.toDateString(), ':', totalCalories);
        setCalories(Math.round(totalCalories));
      } else {
        console.log('No calories data found for', date.toDateString());
        setCalories(0);
      }
    })

    AppleHealthKit.getSleepSamples(timeRangeOptions, (err, result) => {
      if (err) {
        console.log("Error getting sleep samples:", err)
        return
      }
      
      console.log('Raw sleep data:', result);
      
      if (result && Array.isArray(result) && result.length > 0) {
        let totalSleepMinutes = 0;
        
        result.forEach(sample => {
            const startDate = new Date(sample.startDate);
            const endDate = new Date(sample.endDate);
            
            // Calculate overlap with our target date
            const sleepStart = startDate < startOfDay ? startOfDay : startDate;
            const sleepEnd = endDate > endOfDay ? endOfDay : endDate;
            
            if (sleepEnd > sleepStart) {
              const durationMinutes = (sleepEnd.getTime() - sleepStart.getTime()) / (1000 * 60);
              totalSleepMinutes += durationMinutes;
            }
          }
        );
        
        const totalSleepHours = totalSleepMinutes / 60;
        console.log('Total sleep hours for', date.toDateString(), ':', totalSleepHours);
        setSleepingHours(Math.round(totalSleepHours * 10) / 10); // Round to 1 decimal
      } else {
        console.log('No sleep data found for', date.toDateString());
        setSleepingHours(0);
      }
    })
  }, [hasPermissions, date]) 

  return { steps, flights, distance, sleepingHours, calories }
}

export default useHealthDataios