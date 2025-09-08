import { CustomTabBar } from '@/components/CustomTabBar';
import { HapticTab } from '@/components/HapticTab';
import type { IconSymbolName } from '@/components/ui/IconSymbol';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../lib/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';
  const isResident = userRole === 'resident';

  type TabItem = { name: string; title: string; icon: IconSymbolName };

  const baseTabs: TabItem[] = [
    { name: 'index', title: 'Community', icon: 'house.fill' },
    { name: 'appointments-enhanced', title: 'Services', icon: 'calendar' },
    { name: 'history', title: 'History', icon: 'clock.fill' },
    { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
  ];

  const adminTabs: TabItem[] = [
    { name: 'admin', title: 'Admin', icon: 'shield.lefthalf.filled' },
    { name: 'reports', title: 'Reports', icon: 'chart.bar.fill' },
    { name: 'admin-dashboard', title: 'Dashboard', icon: 'gearshape.fill' },
    { name: 'resident-records', title: 'Residents', icon: 'person.3.fill' },
    { name: 'post-announcement', title: 'Post', icon: 'megaphone.fill' },
  ];

  const staffTabs: TabItem[] = [
    { name: 'reports', title: 'Reports', icon: 'chart.bar.fill' },
    { name: 'resident-records', title: 'Residents', icon: 'person.3.fill' },
  ];

  // Get admin tab names for custom tab bar
  const adminTabNames = adminTabs.map(tab => tab.name);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
      tabBar={(props) => (
        <CustomTabBar 
          {...props} 
          adminTabs={adminTabNames} 
          userRole={userRole} 
        />
      )}>
      {/* Base tabs visible to all users */}
      {baseTabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={tab.icon} color={color} />,
          }}
        />
      ))}

      {/* Admin-only tabs with route protection */}
      {adminTabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={tab.icon} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (!isAdmin) {
                e.preventDefault();
                // Could show an alert or redirect to access denied
              }
            },
          }}
        />
      ))}

      {/* Staff additional tabs (if any) */}
      {isStaff && staffTabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
