import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../theme';
import { Icon, IconName } from './Icon';

interface BottomNavBarProps {
  activeTab: 'home' | 'map' | 'history' | 'profile';
  onTabPress: (tab: 'home' | 'map' | 'history' | 'profile') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: { key: 'home' | 'map' | 'history' | 'profile'; label: string; icon: IconName }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'map', label: 'Map', icon: 'map' },
    { key: 'history', label: 'History', icon: 'history' },
    { key: 'profile', label: 'Profile', icon: 'user' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const color = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabPress(tab.key)}
            style={styles.tabButton}
          >
            <View style={styles.iconContainer}>
              <Icon name={tab.icon} size={20} color={color} />
              {isActive && <View style={styles.activeDot} />}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 62,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});
