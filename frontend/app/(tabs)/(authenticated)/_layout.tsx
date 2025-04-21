import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Svg } from 'react-native-svg'

import Activity from '../../../assets/activitynavbaricon';
import Profile from '../../../assets/profilenavbaricon';
import Workout from '../../../assets/workoutnavbaricon';
import RoutinesIcon from '../../../assets/routinesnavbaricon';
import HomeIcon from '../../../assets/homenavbaricon';

const LoggedLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}>
        <Tabs.Screen
            name="home"
            options={{
                title: "Home",
                headerShown: false,
                tabBarIcon: ({ color }) => (
                <HomeIcon width={24} height={24} color={color} />
                ),
            }}
            />
        <Tabs.Screen
            name="routines"
            options={{
            title: "Routines",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <RoutinesIcon width={24} height={24} color={color} />
            ),
            }} />

        <Tabs.Screen
            name="workout"
            options={{
            title: "Workout",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <Workout width={24} height={24} color={color} />
            ),
            }} />

        <Tabs.Screen
            name="activity"
            options={{
            title: "Activity",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <Activity width={24} height={24} color={color} />
            ),
            }} />
        <Tabs.Screen
            name="profile"
            options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <Profile width={24} height={24} color={color} />
            ),
            }} />
      
    </Tabs>
    
  )
}

export default LoggedLayout