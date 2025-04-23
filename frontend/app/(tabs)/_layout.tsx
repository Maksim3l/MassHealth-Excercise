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
      <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
      
       
      
    </Stack>
  );
}