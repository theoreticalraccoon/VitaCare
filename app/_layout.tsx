import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/store/AppContext';

// Hide the benign Expo Go notice for expo-notifications — reminders are
// intentionally disabled in Expo Go and work in a real build.
LogBox.ignoreLogs([
  'expo-notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

/** Root layout: provides global state and hosts the navigation stack. */
export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="+not-found"
            options={{ headerShown: true, title: 'Not Found' }}
          />
        </Stack>
      </SafeAreaProvider>
    </AppProvider>
  );
}
