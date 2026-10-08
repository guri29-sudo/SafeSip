import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, typography } from '../theme';
import { SafetyStatus } from '../types';
import { Icon } from './Icon';

interface StatusBadgeProps {
  status: SafetyStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  style,
}) => {
  const getConfig = () => {
    switch (status) {
      case 'SAFE':
        return {
          bg: colors.safeLight,
          textColor: colors.safeText,
          borderColor: colors.safeBorder,
          label: 'SAFE',
          iconName: 'check' as const,
        };
      case 'CAUTION':
        return {
          bg: colors.cautionLight,
          textColor: colors.cautionText,
          borderColor: colors.cautionBorder,
          label: 'CAUTION',
          iconName: 'alert-triangle' as const,
        };
      case 'UNSAFE':
        return {
          bg: colors.unsafeLight,
          textColor: colors.unsafeText,
          borderColor: colors.unsafeBorder,
          label: 'UNSAFE',
          iconName: 'alert-circle' as const,
        };
      case 'UNVERIFIED':
      default:
        return {
          bg: colors.unverifiedLight,
          textColor: colors.unverifiedText,
          borderColor: colors.unverifiedBorder,
          label: 'UNVERIFIED',
          iconName: 'info' as const,
        };
    }
  };

  const config = getConfig();

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 2, paddingHorizontal: 6 };
      case 'lg':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'md':
      default:
        return { paddingVertical: 4, paddingHorizontal: 8 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return 13;
      case 'md':
      default:
        return 11;
    }
  };

  const iconSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <View
      style={[
        styles.badge,
        getPadding(),
        {
          backgroundColor: config.bg,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      {showIcon && (
        <View style={{ marginRight: 4 }}>
          <Icon name={config.iconName} size={iconSize} color={config.textColor} />
        </View>
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: getFontSize(),
            color: config.textColor,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
