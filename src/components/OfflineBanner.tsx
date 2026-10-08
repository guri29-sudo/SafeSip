import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, typography } from '../theme';
import { Icon } from './Icon';

interface OfflineBannerProps {
  isOffline: boolean;
  pendingCount?: number;
  onSyncPress?: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  pendingCount = 0,
  onSyncPress,
  isSyncing = false,
}) => {
  if (!isOffline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, isOffline ? styles.offlineBg : styles.pendingBg]}>
      <View style={styles.leftRow}>
        <Icon
          name={isOffline ? 'wifi-off' : 'cloud-sync'}
          size={16}
          color={isOffline ? colors.cautionText : colors.primary}
        />
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: isOffline ? colors.cautionText : colors.textPrimary },
            ]}
          >
            {isOffline ? 'Offline Mode Active' : 'Unsynced Local Tests'}
          </Text>
          <Text style={styles.subtitle}>
            {isOffline
              ? 'Readings saved locally to SQLite queue. Auto-syncing when online.'
              : `${pendingCount} reading${pendingCount > 1 ? 's' : ''} awaiting cloud sync.`}
          </Text>
        </View>
      </View>

      {pendingCount > 0 && !isOffline && onSyncPress && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSyncPress}
          disabled={isSyncing}
          style={styles.syncButton}
        >
          <Icon
            name="refresh-cw"
            size={13}
            color={isSyncing ? colors.textMuted : colors.primary}
          />
          <Text style={[styles.syncButtonText, isSyncing && { color: colors.textMuted }]}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  offlineBg: {
    backgroundColor: colors.cautionLight,
    borderBottomColor: colors.cautionBorder,
  },
  pendingBg: {
    backgroundColor: colors.primarySubtle,
    borderBottomColor: colors.primaryLight,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 8,
  },
  syncButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
});
