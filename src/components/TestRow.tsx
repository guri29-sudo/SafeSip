import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../theme';
import { WaterTest } from '../types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

interface TestRowProps {
  test: WaterTest;
  onPress?: () => void;
  style?: ViewStyle;
}

export const TestRow: React.FC<TestRowProps> = ({ test, onPress, style }) => {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName} numberOfLines={1}>
            {test.sourceName || test.locationName || 'Water Test Sample'}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="map-pin" size={11} color={colors.textMuted} />
            <Text style={styles.locationName} numberOfLines={1}>
              {test.locationName || `${test.latitude.toFixed(3)}, ${test.longitude.toFixed(3)}`}
            </Text>
          </View>
        </View>

        <StatusBadge status={test.safetyStatus} size="sm" />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.dateText}>{formatDate(test.timestamp)}</Text>

        <View style={styles.metricsSummary}>
          <Text style={styles.metricsText}>
            pH {test.pH.toFixed(1)}  •  {test.tds} ppm  •  {test.turbidity.toFixed(1)} NTU
          </Text>
          {test.syncStatus === 'pending' && (
            <View style={styles.pendingTag}>
              <Icon name="cloud-sync" size={10} color={colors.cautionText} />
              <Text style={styles.pendingTagText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.subtle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sourceInfo: {
    flex: 1,
    marginRight: 8,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  metricsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cautionLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
    marginLeft: 6,
  },
  pendingTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.cautionText,
    marginLeft: 3,
  },
});
