// app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../lib/context/AuthContext';

interface TabConfig {
  name: string;
  title: string;
  icon: string;
  requiredRole?: 'admin' | 'resident';
}

const TABS: TabConfig[] = [
  { name: 'index', title: 'Community', icon: 'message.fill' },
  { name: 'appointments', title: 'Appointments', icon: 'calendar' },
  { name: 'history', title: 'History', icon: 'clock.fill' },
  { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
  { name: '(admin)/dashboard', title: 'Admin', icon: 'hammer.fill', requiredRole: 'admin' },
  { name: '(admin)/announcements', title: 'Announcements', icon: 'megaphone.fill', requiredRole: 'admin' },
  { name: '(admin)/reports', title: 'Reports', icon: 'chart.bar.fill', requiredRole: 'admin' },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const visibleTabs = useMemo(() => {
    return TABS.filter(tab => 
      !tab.requiredRole || tab.requiredRole === user?.role
    );
  }, [user?.role]);

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
    tabBarStyle: Platform.select({
      ios: { position: 'absolute' as const },
      default: {},
    }),
  }), [colorScheme]);

  return (
    <Tabs screenOptions={screenOptions}>
      {visibleTabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}