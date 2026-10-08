import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import { ParameterCard } from '../components/ParameterCard';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { OfflineBanner } from '../components/OfflineBanner';

interface HomeScreenProps {
  onNavigateToTest: () => void;
  onNavigateToConnect: () => void;
  onNavigateToMap: () => void;
  onNavigateToHistory: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToTest,
  onNavigateToConnect,
  onNavigateToMap,
  onNavigateToHistory,
}) => {
  const {
    currentUser,
    connectedDevice,
    bleState,
    lastCompletedTest,
    isOffline,
    syncQueue,
    triggerSync,
    isSyncing,
  } = useAppStore();

  const currentReading = lastCompletedTest || {
    pH: 7.4,
    tds: 125,
    conductivity: 310,
    turbidity: 0.8,
    temperature: 22.5,
    safetyStatus: 'SAFE' as const,
    locationName: 'Lake View Reservoir',
    timestamp: new Date().toISOString(),
  };

  const formatLastTestedTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Today';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner
        isOffline={isOffline}
        pendingCount={syncQueue.length}
        onSyncPress={triggerSync}
        isSyncing={isSyncing}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Greeting & Profile */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>
              Hi, {currentUser?.fullName || 'Vedant'} 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              Bottle connected • Ready for drinking test
            </Text>
          </View>

          {/* Profile Avatar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNavigateToConnect}
            style={styles.avatarButton}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {currentUser?.fullName ? currentUser.fullName[0] : 'V'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hardware Pairing Status Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateToConnect}
          style={styles.deviceStatusPill}
        >
          <View style={styles.deviceLeft}>
            <View
              style={[
                styles.deviceStatusDot,
                {
                  backgroundColor:
                    bleState === 'connected' ? colors.safe : colors.caution,
                },
              ]}
            />
            <Icon name="bluetooth" size={14} color={colors.textSecondary} />
            <Text style={styles.deviceName}>
              {connectedDevice ? connectedDevice.name : 'No bottle paired'}
            </Text>
          </View>

          <View style={styles.deviceRight}>
            {connectedDevice ? (
              <View style={styles.batteryRow}>
                <Icon name="battery" size={14} color={colors.textSecondary} />
                <Text style={styles.batteryText}>{connectedDevice.batteryLevel}%</Text>
              </View>
            ) : (
              <Text style={styles.pairText}>Pair Bottle</Text>
            )}
            <Icon name="chevron-right" size={14} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Main Status Hero Card */}
        <View style={styles.mainStatusCard}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusLabelGroup}>
              <Text style={styles.statusOverline}>LAST TEST CLASSIFICATION</Text>
              <Text style={styles.statusVerdict}>SAFE</Text>
            </View>
            <StatusBadge status="SAFE" size="lg" />
          </View>

          <Text style={styles.statusDescription}>Good quality for drinking</Text>

          <View style={styles.statusDivider} />

          <View style={styles.statusMetaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Sample Location</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {currentReading.locationName || 'Lake View Reservoir'}
              </Text>
            </View>
            <View style={styles.metaColRight}>
              <Text style={styles.metaLabel}>Tested At</Text>
              <Text style={styles.metaValue}>
                {formatLastTestedTime(currentReading.timestamp)}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary CTA Button: Test Water */}
        <View style={styles.ctaContainer}>
          <Button
            title="Test Water →"
            onPress={onNavigateToTest}
            size="lg"
            style={styles.testWaterButton}
          />
        </View>

        {/* Parameters Section */}
        <View style={styles.parametersSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Physicochemical Parameters</Text>
            <TouchableOpacity onPress={onNavigateToHistory}>
              <Text style={styles.historyLink}>History</Text>
            </TouchableOpacity>
          </View>

          {/* 5 Parameters in a clean hierarchy */}
          <ParameterCard
            paramKey="pH"
            value={currentReading.pH}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="tds"
            value={currentReading.tds}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="conductivity"
            value={currentReading.conductivity}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="turbidity"
            value={currentReading.turbidity}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="temperature"
            value={currentReading.temperature}
            highlightStatus="SAFE"
          />
        </View>

        {/* Quick Map Community Teaser */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateToMap}
          style={styles.communityTeaserCard}
        >
          <View style={styles.teaserIconBox}>
            <Icon name="map-pin" size={20} color={colors.primary} />
          </View>
          <View style={styles.teaserContent}>
            <Text style={styles.teaserTitle}>5 Community Sources Nearby</Text>
            <Text style={styles.teaserSubtitle}>
              Explore verified fresh springs and filtration spots
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  deviceStatusPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.subtle,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  deviceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  pairText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  mainStatusCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.safeBorder,
    marginBottom: 16,
    ...shadows.card,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  statusLabelGroup: {
    flex: 1,
  },
  statusOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.safeText,
    letterSpacing: 0.6,
  },
  statusVerdict: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.safe,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statusDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statusDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  statusMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
    marginRight: 8,
  },
  metaColRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ctaContainer: {
    marginBottom: 20,
  },
  testWaterButton: {
    height: 52,
  },
  parametersSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  historyLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  communityTeaserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  teaserIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teaserContent: {
    flex: 1,
  },
  teaserTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  teaserSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
