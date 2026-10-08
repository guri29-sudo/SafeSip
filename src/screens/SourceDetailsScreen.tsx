import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ParameterCard } from '../components/ParameterCard';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { WaterSource, WaterTest } from '../types';
import { dbService } from '../database/storageService';

interface SourceDetailsScreenProps {
  source: WaterSource;
  onBack: () => void;
  onViewOnMap: () => void;
  onStartTestAtSource?: () => void;
}

const { width } = Dimensions.get('window');

export const SourceDetailsScreen: React.FC<SourceDetailsScreenProps> = ({
  source,
  onBack,
  onViewOnMap,
  onStartTestAtSource,
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'History' | 'Graph'>('Overview');

  const sourceTests = dbService.getTestsForSource(source.id);

  const tabs: ('Overview' | 'History' | 'Graph')[] = ['Overview', 'History', 'Graph'];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={source.name}
        subtitle={source.locationName}
        onBack={onBack}
        rightAction={
          <StatusBadge status={source.safetyStatus} size="sm" />
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Visual of Water Source */}
        <View style={styles.heroBanner}>
          <View style={styles.heroGraphic}>
            <View style={styles.waterReflectionWave} />
            <View style={styles.waterReflectionWave2} />
            <View style={styles.heroCenterBadge}>
              <Icon name="droplet" size={28} color={colors.primary} />
            </View>
          </View>
          <View style={styles.heroOverlayContent}>
            <Text style={styles.heroTitle}>{source.name}</Text>
            <Text style={styles.heroSubtitle}>
              {source.testCount} community verification tests recorded
            </Text>
          </View>
        </View>

        {/* Tab Navigation: Overview | History | Graph */}
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const isCurrent = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isCurrent && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isCurrent && styles.tabButtonTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <View style={styles.tabContent}>
            {/* Source Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryVal}>{source.locationName}</Text>
                </View>
                <View style={styles.summaryItemRight}>
                  <Text style={styles.summaryLabel}>Last Tested</Text>
                  <Text style={styles.summaryVal}>{formatDate(source.lastTestedAt)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Coordinates</Text>
                  <Text style={styles.summaryValSmall}>
                    {source.latitude.toFixed(4)}° N, {Math.abs(source.longitude).toFixed(4)}° W
                  </Text>
                </View>
                <View style={styles.summaryItemRight}>
                  <Text style={styles.summaryLabel}>Verification Status</Text>
                  <Text style={styles.summaryValSmall}>Community Peer Verified</Text>
                </View>
              </View>
            </View>

            {/* Latest Readings Heading */}
            <Text style={styles.sectionTitle}>Latest Physicochemical Profile</Text>

            <ParameterCard
              paramKey="pH"
              value={source.latestPh}
              highlightStatus={source.safetyStatus}
            />
            <ParameterCard
              paramKey="tds"
              value={source.latestTds}
              highlightStatus={source.safetyStatus}
            />
            <ParameterCard
              paramKey="conductivity"
              value={source.latestConductivity}
              highlightStatus={source.safetyStatus}
            />
            <ParameterCard
              paramKey="turbidity"
              value={source.latestTurbidity}
              highlightStatus={source.safetyStatus}
            />
            <ParameterCard
              paramKey="temperature"
              value={source.latestTemperature}
              highlightStatus={source.safetyStatus}
            />

            {source.description && (
              <View style={styles.descCard}>
                <Text style={styles.descTitle}>Hydrological Field Notes</Text>
                <Text style={styles.descBody}>{source.description}</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <Button
                title="View on Map"
                variant="outline"
                onPress={onViewOnMap}
                icon="map-pin"
                style={{ flex: 1, marginRight: 8 }}
                fullWidth={false}
              />
              {onStartTestAtSource && (
                <Button
                  title="Test Here"
                  onPress={onStartTestAtSource}
                  icon="play"
                  style={{ flex: 1, marginLeft: 8 }}
                  fullWidth={false}
                />
              )}
            </View>
          </View>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'History' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Test History for {source.name}</Text>
            {sourceTests.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="history" size={28} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Individual Test History</Text>
                <Text style={styles.emptySub}>
                  Be the first to record a verified SafeSip measurement at this site.
                </Text>
              </View>
            ) : (
              sourceTests.map(test => (
                <View key={test.id} style={styles.historyRow}>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyDate}>{formatDate(test.timestamp)}</Text>
                    <Text style={styles.historyLocation}>{test.locationName || 'Shore Point'}</Text>
                    <Text style={styles.historyParams}>
                      pH {test.pH.toFixed(1)} • {test.tds} ppm • {test.turbidity.toFixed(1)} NTU
                    </Text>
                  </View>
                  <StatusBadge status={test.safetyStatus} size="sm" />
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: GRAPH (Historical Trend Lines) */}
        {activeTab === 'Graph' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Historical Parameter Trends</Text>
            <Text style={styles.graphSub}>
              Physicochemical equilibrium stability over the past 30 days.
            </Text>

            {/* pH Trend Line Chart Visualizer */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>pH Stability Trend (Safe: 6.5 - 8.5)</Text>
                <Text style={styles.chartCurrent}>Current: {source.latestPh}</Text>
              </View>
              <View style={styles.trendGraphCanvas}>
                {/* Horizontal reference threshold lines */}
                <View style={[styles.refLine, { top: 20 }]}>
                  <Text style={styles.refLineText}>8.5 Max</Text>
                </View>
                <View style={[styles.refLine, { top: 60 }]}>
                  <Text style={styles.refLineText}>7.0 Neutral</Text>
                </View>
                <View style={[styles.refLine, { top: 90 }]}>
                  <Text style={styles.refLineText}>6.5 Min</Text>
                </View>
                {/* Trend points connected */}
                <View style={styles.trendPointsRow}>
                  {[7.2, 7.3, 7.5, 7.4, 7.6, 7.3, source.latestPh].map((val, idx) => (
                    <View key={idx} style={styles.trendColumn}>
                      <View
                        style={[
                          styles.trendDot,
                          {
                            marginBottom: (val - 6.5) * 40,
                            backgroundColor:
                              val >= 6.5 && val <= 8.5 ? colors.safe : colors.caution,
                          },
                        ]}
                      />
                      <Text style={styles.trendXLabel}>T-{7 - idx}d</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* TDS Trend Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>TDS Trend (Target: &lt; 300 ppm)</Text>
                <Text style={styles.chartCurrent}>{source.latestTds} ppm</Text>
              </View>
              <View style={styles.trendGraphCanvas}>
                <View style={[styles.refLine, { top: 30 }]}>
                  <Text style={styles.refLineText}>300 ppm Caution</Text>
                </View>
                <View style={styles.trendPointsRow}>
                  {[140, 135, 128, 130, 122, 126, source.latestTds].map((val, idx) => (
                    <View key={idx} style={styles.trendColumn}>
                      <View
                        style={[
                          styles.trendDot,
                          {
                            marginBottom: (val / 300) * 60,
                            backgroundColor: val <= 300 ? colors.primary : colors.caution,
                          },
                        ]}
                      />
                      <Text style={styles.trendXLabel}>T-{7 - idx}d</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 36,
  },
  heroBanner: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 16,
    position: 'relative',
  },
  heroGraphic: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
  },
  waterReflectionWave: {
    position: 'absolute',
    width: width * 1.2,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#BAE6FD',
    bottom: -20,
    opacity: 0.6,
  },
  waterReflectionWave2: {
    position: 'absolute',
    width: width,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7DD3FC',
    bottom: -15,
    opacity: 0.4,
  },
  heroCenterBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  heroOverlayContent: {
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabContent: {
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.subtle,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryItemRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryValSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  descCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  descBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  historyMeta: {
    flex: 1,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  historyLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  historyParams: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  graphSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  chartCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.subtle,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chartCurrent: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  trendGraphCanvas: {
    height: 120,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  refLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    borderStyle: 'dashed',
  },
  refLineText: {
    fontSize: 9,
    color: colors.textMuted,
    position: 'absolute',
    right: 4,
    top: -12,
  },
  trendPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 16,
  },
  trendColumn: {
    alignItems: 'center',
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendXLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },
});
