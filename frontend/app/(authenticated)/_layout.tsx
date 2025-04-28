import { Stack, Tabs } from "expo-router";

export default function TabsLayout() {
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