import type { IconSymbolName } from '@/components/ui/IconSymbol';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomTabBarProps extends BottomTabBarProps {
  adminTabs?: string[];
  userRole?: string | null;
}

export function CustomTabBar({ 
  state, 
  descriptors, 
  navigation, 
  adminTabs = [], 
  userRole 
}: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isAdmin = userRole === 'admin';

  // Separate base tabs from admin tabs
  const baseTabIndices = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => !adminTabs.includes(route.name))
    .map(({ index }) => index);

  const adminTabIndices = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => adminTabs.includes(route.name))
    .map(({ index }) => index);

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel !== undefined 
      ? options.tabBarLabel 
      : options.title !== undefined 
      ? options.title 
      : route.name;

    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    const iconName = options.tabBarIcon 
      ? (options.tabBarIcon({ focused: isFocused, color: '', size: 0 }) as any)?.props?.name
      : 'circle';

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
      >
        <IconSymbol
          name={iconName as IconSymbolName}
          size={24}
          color={isFocused ? colors.tabIconSelected : colors.tabIconDefault}
        />
        <Text style={[
          styles.tabLabel,
          { color: isFocused ? colors.tabIconSelected : colors.tabIconDefault }
        ]}>
          {typeof label === 'string' ? label : route.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Base tabs */}
      <View style={styles.tabGroup}>
        {baseTabIndices.map(renderTab)}
      </View>

      {/* Admin section separator and tabs */}
      {isAdmin && adminTabIndices.length > 0 && (
        <>
          <View style={[styles.separator, { backgroundColor: colors.icon }]} />
          <View style={styles.adminSection}>
            <Text style={[styles.adminLabel, { color: colors.icon }]}>ADMIN</Text>
            <View style={styles.tabGroup}>
              {adminTabIndices.map(renderTab)}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    marginHorizontal: 8,
    opacity: 0.3,
  },
  adminSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  adminLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.7,
  },
});
