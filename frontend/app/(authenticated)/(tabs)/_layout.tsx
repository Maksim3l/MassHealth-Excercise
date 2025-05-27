import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { router, Tabs } from 'expo-router'
import { Svg } from 'react-native-svg'
import { supabase } from '../../../utils/supabase'
import Activity from '../../../assets/tsxicons/activitynavbaricon';
import Profile from '../../../assets/tsxicons/profilenavbaricon';
import Workout from '../../../assets/tsxicons/workoutnavbaricon';
import RoutinesIcon from '../../../assets/tsxicons/routinesnavbaricon';
import HomeIcon from '../../../assets/tsxicons/homenavbaricon';

const LoggedLayout = () => {
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
                console.log("No active session found, redirecting to login");
                router.replace('/login');
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`Auth event: ${event}`);
            
            // When session becomes null
            if (!session) {
                console.log("Session expired or user logged out, redirecting to login");
                router.replace('/login');
            }
        });

        
        return () => {
        authListener.subscription.unsubscribe();
        };
    }, []);
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
                tabBarActiveTintColor: "#6E49EB",
                tabBarIcon: ({ color }) => (
                <HomeIcon width={24} height={24} color={color} />
                ),
            }}
            />
        <Tabs.Screen
            name="routines"
            options={{
            title: "Routines",
            tabBarActiveTintColor: "#6E49EB",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <RoutinesIcon width={24} height={24} color={color} />
            ),
            }} />

        <Tabs.Screen
            name="workout"
            options={{
            title: "Workout",
            tabBarActiveTintColor: "#6E49EB",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <Workout width={24} height={24} color={color} />
            ),
            }} />

        <Tabs.Screen
            name="activity"
            options={{
            title: "Activity",
            tabBarActiveTintColor: "#6E49EB",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <Activity width={24} height={24} color={color} />
            ),
            }} />
        <Tabs.Screen
            name="profile"
            options={{
            title: "Profile",
            tabBarActiveTintColor: "#6E49EB",
            headerShown: false,
            tabBarIcon: ({ color }) => (
                <Profile width={24} height={24} color={color} />
            ),
            }} />

            
            
      
    </Tabs>
    
  )
}

export default LoggedLayout