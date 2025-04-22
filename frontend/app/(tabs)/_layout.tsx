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
    </Stack>
  );
}