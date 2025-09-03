import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '../../app/lib/AuthContext'; // Import useAuth

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole } = useAuth(); // Get userRole from context

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
        }}
      />
      {userRole === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="hammer.fill" color={color} />,
          }}
        />
      )}
      {userRole === 'admin' && (
        <Tabs.Screen
          name="post-announcement"
          options={{
            title: 'Post Announcement',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="megaphone.fill" color={color} />,
          }}
        />
      )}
      {userRole === 'admin' && (
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
