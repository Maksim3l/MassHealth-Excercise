import { Stack } from 'expo-router';
import GlobalDataProvider from './GlobalDataProvider';

export default function RootLayout() {
  return (
     <GlobalDataProvider>
      <Stack>
        <Stack.Screen name="entry" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
      </Stack>
    </GlobalDataProvider>
  );
}