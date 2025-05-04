import { router, Stack, Tabs } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../../utils/supabase";

export default function TabsLayout() {
  useEffect(() => {
    const {data: authListener} = supabase.auth.onAuthStateChange((event, session) => {
      if(!session) {
        router.replace('/login')
      }
    });

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])
  return (
    <Stack 
  screenOptions={{ headerShown: false }}
    >
     
      <Stack.Screen name="tags" 
                  options={{ title: "tags", 
                  }} />

      <Stack.Screen name="userstats"
                   options={{ title: "userstats", 
                    }} />
      <Stack.Screen name="map"
                   options={{ title: "Map", 
                    }} />
      <Stack.Screen name="createroutine" options={{title: "CreateRoutine"}} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="routinepreview" />
      
       
      
    </Stack>
  );
}