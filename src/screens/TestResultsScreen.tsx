import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { ParameterCard } from '../components/ParameterCard';
import { Icon } from '../components/Icon';
import { WaterTest } from '../types';

interface TestResultsScreenProps {
  testResult?: WaterTest | null;
  onSave: () => void;
  onBack: () => void;
}

export const TestResultsScreen: React.FC<TestResultsScreenProps> = ({
  testResult,
  onSave,
  onBack,
}) => {
  const { lastCompletedTest, saveTestResult, isOffline } = useAppStore();
  const [isSaved, setIsSaved] = useState(false);

  const test = testResult || lastCompletedTest || {
    id: 'test-demo',
    deviceId: 'SafeSip_0012',
    userId: 'usr-vedant-01',
    sourceName: 'Lake View Reservoir',
    locationName: 'North Basin, Shoreline Trail',
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: new Date().toISOString(),
    pH: 7.4,
    tds: 125,
    conductivity: 310,
    turbidity: 0.8,
    temperature: 22.5,
    safetyStatus: 'SAFE' as const,
    syncStatus: 'synced' as const,
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'SafeSip Water Quality Report',
        message: `SafeSip Water Report\nClassification: ${test.safetyStatus}\nLocation: ${test.locationName || 'Current Sample'}\npH: ${test.pH} | TDS: ${test.tds} ppm | Conductivity: ${test.conductivity} µS/cm | Turbidity: ${test.turbidity} NTU | Temp: ${test.temperature} °C\nTested with SafeSip Smart Bottle.`,
      });
    } catch {
      // User dismissed
    }
  };

  const handleSaveResult = () => {
    saveTestResult();
    setIsSaved(true);
    Alert.alert(
      'Test Saved',
      isOffline
        ? 'Reading saved locally to offline storage queue. It will automatically upload to the community cloud when connected.'
        : 'Water test successfully saved and synchronized with your account.',
      [{ text: 'OK', onPress: onSave }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Test Results"
        subtitle="ESP32 Physicochemical Classification"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Prominent Final Classification Card */}
        <View style={styles.verdictCard}>
          <View style={styles.verdictTopRow}>
            <View>
              <Text style={styles.verdictOverline}>OVERALL CLASSIFICATION</Text>
              <Text style={styles.verdictTitle}>SAFE</Text>
            </View>
            <StatusBadge status="SAFE" size="lg" />
          </View>

          <Text style={styles.verdictSubtitle}>Water is safe for drinking</Text>

          <View style={styles.verdictDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Timestamp</Text>
              <Text style={styles.metaValue}>
                {new Date(test.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>GPS Coordinates</Text>
              <Text style={styles.metaValue}>
                {test.latitude.toFixed(4)}, {test.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Five Parameters with measured value, acceptable range, and pass/check indicator */}
        <View style={styles.parametersSection}>
          <Text style={styles.sectionHeading}>Measured Parameters</Text>

          <ParameterCard
            paramKey="pH"
            value={test.pH}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="tds"
            value={test.tds}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="conductivity"
            value={test.conductivity}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="turbidity"
            value={test.turbidity}
            highlightStatus="SAFE"
          />
          <ParameterCard
            paramKey="temperature"
            value={test.temperature}
            highlightStatus="SAFE"
          />
        </View>

        {/* Required Scientific Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Icon name="info" size={15} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            SAFE indicates that measured physicochemical parameters are within configured thresholds. It does not constitute laboratory or microbiological certification.
          </Text>
        </View>

        {/* Action Buttons: Save Result & Share */}
        <View style={styles.actions}>
          <Button
            title={isSaved ? 'Saved to Records' : 'Save Result'}
            onPress={handleSaveResult}
            size="lg"
            icon="check"
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Share Report"
            variant="secondary"
            size="md"
            icon="share"
            onPress={handleShare}
          />
        </View>
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
  verdictCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.safeBorder,
    marginBottom: 20,
    ...shadows.card,
  },
  verdictTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  verdictOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.safeText,
    letterSpacing: 0.6,
  },
  verdictTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.safe,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  verdictSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  verdictDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
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
  parametersSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    marginBottom: 10,
  },
});
