import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="home" 
        options={{
          title: "Home",
          // Add your tab options here
        }}
      />
      {/* Add other tab screens here */}
    </Tabs>
  );
}