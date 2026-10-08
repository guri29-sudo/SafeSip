import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { PARAMETER_CONFIG, SafetyStatus } from '../types';
import { Icon } from './Icon';

interface ParameterCardProps {
  paramKey: 'pH' | 'tds' | 'conductivity' | 'turbidity' | 'temperature';
  value: number;
  highlightStatus?: SafetyStatus;
  style?: ViewStyle;
  compact?: boolean;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({
  paramKey,
  value,
  highlightStatus,
  style,
  compact = false,
}) => {
  const config = PARAMETER_CONFIG[paramKey];

  // Calculate status if not directly provided
  const getStatus = (): 'SAFE' | 'CAUTION' | 'UNSAFE' => {
    if (highlightStatus && highlightStatus !== 'UNVERIFIED') {
      return highlightStatus;
    }

    switch (paramKey) {
      case 'pH':
        if (value >= 6.5 && value <= 8.5) return 'SAFE';
        if ((value >= 6.0 && value < 6.5) || (value > 8.5 && value <= 9.0)) return 'CAUTION';
        return 'UNSAFE';

      case 'tds':
        if (value <= 300) return 'SAFE';
        if (value <= 500) return 'CAUTION';
        return 'UNSAFE';

      case 'conductivity':
        if (value >= 100 && value <= 500) return 'SAFE';
        if (value <= 800) return 'CAUTION';
        return 'UNSAFE';

      case 'turbidity':
        if (value <= 1.0) return 'SAFE';
        if (value <= 5.0) return 'CAUTION';
        return 'UNSAFE';

      case 'temperature':
        if (value >= 10 && value <= 25) return 'SAFE';
        if (value > 25 && value <= 35) return 'CAUTION';
        return 'UNSAFE';

      default:
        return 'SAFE';
    }
  };

  const status = getStatus();

  const getStatusVisuals = () => {
    switch (status) {
      case 'SAFE':
        return {
          color: colors.safe,
          bg: colors.safeLight,
          textColor: colors.safeText,
          icon: 'check' as const,
          label: 'Within limit',
        };
      case 'CAUTION':
        return {
          color: colors.caution,
          bg: colors.cautionLight,
          textColor: colors.cautionText,
          icon: 'alert-triangle' as const,
          label: 'Elevated',
        };
      case 'UNSAFE':
      default:
        return {
          color: colors.unsafe,
          bg: colors.unsafeLight,
          textColor: colors.unsafeText,
          icon: 'alert-circle' as const,
          label: 'Out of range',
        };
    }
  };

  const visuals = getStatusVisuals();

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactHeader}>
          <Text style={styles.paramNameSmall}>{config.name}</Text>
          <View style={[styles.miniIndicator, { backgroundColor: visuals.color }]} />
        </View>
        <Text style={styles.compactValue}>
          {value} <Text style={styles.compactUnit}>{config.unit}</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.leftContent}>
        <View style={styles.titleRow}>
          <Text style={styles.paramName}>{config.name}</Text>
          <View style={[styles.statusChip, { backgroundColor: visuals.bg }]}>
            <Icon name={visuals.icon} size={11} color={visuals.textColor} />
            <Text style={[styles.statusChipText, { color: visuals.textColor }]}>
              {visuals.label}
            </Text>
          </View>
        </View>
        <Text style={styles.safeRangeText}>Safe: {config.safeRange}</Text>
      </View>

      <View style={styles.rightContent}>
        <Text style={styles.valueText}>
          {value}
          {config.unit ? <Text style={styles.unitText}> {config.unit}</Text> : null}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.subtle,
  },
  leftContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paramName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  safeRangeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Compact layout
  compactContainer: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginHorizontal: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paramNameSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  miniIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  compactUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
