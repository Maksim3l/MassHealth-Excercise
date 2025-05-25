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
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning
    ],
    write: []
  }
}

const useHealthDataios = (date: Date) => {
  const [hasPermissions, setHasPermissions] = useState(false)
  const [steps, setSteps] = useState(0)
  const [flights, setFlights] = useState(0)
  const [distance, setDistance] = useState(0)

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

    // Use the passed date instead of new Date()
    const options: HealthInputOptions = {
      date: date.toISOString(), // This is the key change!
      includeManuallyAdded: false,
    };

    AppleHealthKit.getStepCount(options, (err, result) => {
      if (err) {
        console.log("Error getting steps")
        return
      }
      console.log('Steps for', date.toDateString(), ':', result.value)
      setSteps(result.value)
    })

    AppleHealthKit.getFlightsClimbed(options, (err, result) => {
      if (err) {
        console.log("Error getting flights climbed")
        return
      }
      console.log('Flights for', date.toDateString(), ':', result.value)
      setFlights(result.value)
    })

    AppleHealthKit.getDistanceWalkingRunning(options, (err, result) => {
      if (err) {
        console.log("Error getting distance")
        return
      }
      console.log('Distance for', date.toDateString(), ':', result.value)
      setDistance(result.value)
    })
  }, [hasPermissions, date]) 

  return { steps, flights, distance }
}

export default useHealthDataios