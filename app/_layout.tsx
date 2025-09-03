import NetInfo from '@react-native-community/netinfo'; // Import NetInfo
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react'; // Import useState
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { registerForPushNotificationsAsync, savePushTokenToFirestore } from './lib/Notifications';
import { syncAnnouncementsWithFirestore, syncBookingsWithFirestore, syncServicesWithFirestore } from './lib/OfflineSync'; // Import sync functions
import LoginScreen from './LoginScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { user, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(true); // State to track online status

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected || false); // Update online status
      if (state.isConnected) {
        console.log('Device is online, attempting to sync data...');
        syncBookingsWithFirestore();
        syncAnnouncementsWithFirestore();
        syncServicesWithFirestore();
      }
    });

    return () => unsubscribeNetInfo();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushTokenToFirestore(user.uid, token);
        }
      });
    }
  }, [user]);

  if (loading) {
    return null;
  }

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {user ? <RootLayoutNav /> : <LoginScreen />}
    </ThemeProvider>
  );
};

const RootLayoutWithProvider = () => {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <RootLayout />
      </PaperProvider>
    </AuthProvider>
  );
};

export default RootLayoutWithProvider;
