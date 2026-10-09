import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    isGuestMode,
    connectedDevice,
    bleState,
    lastCompletedTest,
    isOffline,
    syncQueue,
    triggerSync,
    isSyncing,
    sources,
  } = useAppStore();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const hasTest = lastCompletedTest !== null;

  const formatLastTestedTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Today';
    }
  };

  const nearbySources = sources.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
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
        <Animated.View
          style={[
            styles.headerRow,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View>
            <Text style={styles.greetingTitle}>
              Hi, {isGuestMode ? 'Guest' : (currentUser?.fullName || 'there')} 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              {isGuestMode
                ? 'Guest Mode (View Only) • Browse Safe Drinking Water'
                : bleState === 'connected'
                ? 'Bottle connected • Ready for drinking test'
                : 'No bottle connected • Tap to pair'}
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
                {isGuestMode
                  ? 'G'
                  : currentUser?.fullName
                  ? currentUser.fullName[0].toUpperCase()
                  : '?'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Hardware Pairing Status Pill */}
        <Animated.View style={{ opacity: fadeAnim }}>
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
        </Animated.View>

        {/* Main Status Hero Card */}
        {hasTest ? (
          <Animated.View
            style={[
              styles.mainStatusCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.statusTopRow}>
              <View style={styles.statusLabelGroup}>
                <Text style={styles.statusOverline}>LAST TEST CLASSIFICATION</Text>
                <Text
                  style={[
                    styles.statusVerdict,
                    {
                      color:
                        lastCompletedTest.safetyStatus === 'SAFE'
                          ? colors.safe
                          : lastCompletedTest.safetyStatus === 'CAUTION'
                          ? colors.caution
                          : colors.unsafe,
                    },
                  ]}
                >
                  {lastCompletedTest.safetyStatus}
                </Text>
              </View>
              <StatusBadge status={lastCompletedTest.safetyStatus} size="lg" />
            </View>

            <Text style={styles.statusDescription}>
              {lastCompletedTest.safetyStatus === 'SAFE'
                ? 'Good quality for drinking'
                : lastCompletedTest.safetyStatus === 'CAUTION'
                ? 'Use with caution — some parameters elevated'
                : 'Do not drink — unsafe parameters detected'}
            </Text>

            <View style={styles.statusDivider} />

            <View style={styles.statusMetaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Sample Location</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {lastCompletedTest.locationName || lastCompletedTest.sourceName || 'Unknown'}
                </Text>
              </View>
              <View style={styles.metaColRight}>
                <Text style={styles.metaLabel}>Tested At</Text>
                <Text style={styles.metaValue}>
                  {formatLastTestedTime(lastCompletedTest.timestamp)}
                </Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.emptyStateCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Icon name="droplet" size={32} color={colors.primary} />
            <Text style={styles.emptyStateTitle}>No tests yet</Text>
            <Text style={styles.emptyStateSub}>
              Connect your SafeSip bottle and run your first water quality test
            </Text>
          </Animated.View>
        )}

        {/* Primary CTA Button: Test Water */}
        <View style={styles.ctaContainer}>
          <Button
            title="Test Water →"
            onPress={onNavigateToTest}
            size="lg"
            style={styles.testWaterButton}
          />
        </View>

        {/* Parameters Section — only shown after a real test */}
        {hasTest && (
          <Animated.View style={[styles.parametersSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Physicochemical Parameters</Text>
              <TouchableOpacity onPress={onNavigateToHistory}>
                <Text style={styles.historyLink}>History</Text>
              </TouchableOpacity>
            </View>

            <ParameterCard
              paramKey="pH"
              value={lastCompletedTest!.pH}
              highlightStatus={lastCompletedTest!.safetyStatus}
            />
            <ParameterCard
              paramKey="tds"
              value={lastCompletedTest!.tds}
              highlightStatus={lastCompletedTest!.safetyStatus}
            />
            <ParameterCard
              paramKey="conductivity"
              value={lastCompletedTest!.conductivity}
              highlightStatus={lastCompletedTest!.safetyStatus}
            />
            <ParameterCard
              paramKey="turbidity"
              value={lastCompletedTest!.turbidity}
              highlightStatus={lastCompletedTest!.safetyStatus}
            />
            <ParameterCard
              paramKey="temperature"
              value={lastCompletedTest!.temperature}
              highlightStatus={lastCompletedTest!.safetyStatus}
            />
          </Animated.View>
        )}

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
            <Text style={styles.teaserTitle}>
              {nearbySources > 0
                ? `${nearbySources} Community Sources`
                : 'Community Map'}
            </Text>
            <Text style={styles.teaserSubtitle}>
              {nearbySources > 0
                ? 'Explore verified water sources nearby'
                : 'Add your test results to the community map'}
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
  emptyStateCard: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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
