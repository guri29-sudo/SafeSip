import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, radius, typography } from '../theme';
import { Icon, IconName } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let paddingVertical = 12;
    let paddingHorizontal = 18;
    let backgroundColor = colors.primary;
    let borderWidth = 0;
    let borderColor = 'transparent';

    switch (size) {
      case 'sm':
        paddingVertical = 8;
        paddingHorizontal = 12;
        break;
      case 'lg':
        paddingVertical = 16;
        paddingHorizontal = 24;
        break;
      case 'md':
      default:
        paddingVertical = 12;
        paddingHorizontal = 18;
        break;
    }

    switch (variant) {
      case 'secondary':
        backgroundColor = colors.surfaceSecondary;
        borderWidth = 1;
        borderColor = colors.border;
        break;
      case 'outline':
        backgroundColor = colors.surface;
        borderWidth = 1.5;
        borderColor = colors.primary;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
      case 'danger':
        backgroundColor = colors.unsafe;
        break;
      case 'primary':
      default:
        backgroundColor = colors.primary;
        break;
    }

    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      width: fullWidth ? '100%' : undefined,
      paddingVertical,
      paddingHorizontal,
      backgroundColor,
      borderWidth,
      borderColor,
      opacity: disabled || loading ? 0.55 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color: string = colors.textInverse;

    switch (variant) {
      case 'secondary':
        color = colors.textPrimary;
        break;
      case 'outline':
        color = colors.primary;
        break;
      case 'ghost':
        color = colors.primary;
        break;
      case 'danger':
      case 'primary':
      default:
        color = colors.white;
        break;
    }

    const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

    return {
      fontSize,
      fontWeight: '600',
      color,
      letterSpacing: 0.1,
    };
  };

  const iconColor =
    variant === 'primary' || variant === 'danger'
      ? colors.white
      : variant === 'outline' || variant === 'ghost'
      ? colors.primary
      : colors.textPrimary;

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: 8 }}>
              <Icon name={icon} size={iconSize} color={iconColor} />
            </View>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: 8 }}>
              <Icon name={icon} size={iconSize} color={iconColor} />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
