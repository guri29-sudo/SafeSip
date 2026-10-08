import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../theme';
import { WaterSource } from '../types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

interface SourceCardProps {
  source: WaterSource;
  onPress: () => void;
  style?: ViewStyle;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, onPress, style }) => {
  const formatTimeAgo = (isoDate: string) => {
    try {
      const now = new Date();
      const past = new Date(isoDate);
      const diffDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 30) return `${diffDays} days ago (Unverified)`;
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={1}>
            {source.name}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="map-pin" size={12} color={colors.textMuted} />
            <Text style={styles.locationName} numberOfLines={1}>
              {source.locationName}
            </Text>
          </View>
        </View>
        <StatusBadge status={source.safetyStatus} size="sm" />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>pH</Text>
          <Text style={styles.metricVal}>{source.latestPh.toFixed(1)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>TDS</Text>
          <Text style={styles.metricVal}>{source.latestTds} ppm</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Turbidity</Text>
          <Text style={styles.metricVal}>{source.latestTurbidity.toFixed(1)} NTU</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.timeText}>Last tested: {formatTimeAgo(source.lastTestedAt)}</Text>
        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.elevated,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
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
    marginLeft: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
});
