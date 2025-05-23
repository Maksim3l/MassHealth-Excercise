import { useEffect, useState } from "react"
import BrokenHealthKit, { HealthInputOptions, HealthKitPermissions, HealthUnit } from "react-native-health";

const NativeModules = require("react-native").NativeModules;
const AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit;
AppleHealthKit.Constants = BrokenHealthKit.Constants;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps, 
          AppleHealthKit.Constants.Permissions.FlightsClimbed,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning ],
    write: []
  }
}

const useHealthData = ({ date }: { date: Date }) => {
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
    if(!hasPermissions) {
      return;
    }

    const options: HealthInputOptions = {
      date: new Date().toISOString(),
      includeManuallyAdded: false,
    };

    AppleHealthKit.getStepCount(options, (err, result) => {
      if (err) {
        console.log("Error getting steps")
        return
      }
      console.log(result.value)
      setSteps(result.value)
    })
    AppleHealthKit.getFlightsClimbed(options, (err, result) => {
      if(err) {
        console.log("Error getting flights climbed")
        return
      }
      console.log(result.value)
      setFlights(result.value)
    })
    AppleHealthKit.getDistanceWalkingRunning(options, (err, result) => {
      if(err) {
        console.log("Error getting distance")
        return
      }
      console.log(result.value)
      setDistance(result.value)
    })
    }, [hasPermissions])

    return { steps, flights, distance }
}

export default useHealthData

