import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ParameterCard } from '../components/ParameterCard';
import { Icon } from '../components/Icon';
import { WaterTest } from '../types';

interface LiveTestingScreenProps {
  onCancel: () => void;
  onComplete: (result: WaterTest) => void;
}

export const LiveTestingScreen: React.FC<LiveTestingScreenProps> = ({
  onCancel,
  onComplete,
}) => {
  const {
    connectedDevice,
    isTesting,
    testProgress,
    testStage,
    liveReading,
    activeTestError,
    startLiveTest,
    cancelLiveTest,
  } = useAppStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation during active test
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Start live sampling sequence on screen mount
    startLiveTest(result => {
      onComplete(result);
    });

    return () => {
      pulseLoop.stop();
      cancelLiveTest();
    };
  }, [pulseAnim]);

  const handleCancel = () => {
    cancelLiveTest();
    onCancel();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title="Live Testing"
        subtitle={connectedDevice ? `${connectedDevice.name} • Active HC-05 Telemetry` : 'Sensor Stream'}
        onBack={handleCancel}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sensor Connection Status Indicator */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.statusText}>
              {activeTestError ? 'Sensor Alert' : 'Sensors Sampling Water Matrix'}
            </Text>
          </View>
          <View style={styles.batteryChip}>
            <Icon name="battery" size={13} color={colors.textSecondary} />
            <Text style={styles.batteryText}>
              {connectedDevice ? `${connectedDevice.batteryLevel}%` : '88%'}
            </Text>
          </View>
        </View>

        {/* Large Circular / Radial Progress Indicator */}
        <View style={styles.progressHeroSection}>
          <Animated.View style={[styles.circularContainer, { transform: [{ scale: pulseAnim }] }]}>
            {/* Outer Progress Track */}
            <View style={styles.outerTrack}>
              {/* Inner Active Ring Container */}
              <View style={styles.innerCircle}>
                <Text style={styles.progressPercentText}>{testProgress}%</Text>
                <Text style={styles.progressSubtext}>Sampling</Text>
              </View>
            </View>
          </Animated.View>

          <Text style={styles.collectingHeading}>Collecting sensor data…</Text>
          <Text style={styles.stageDescription}>{testStage}</Text>
        </View>

        {/* Live Parameter Values Updating via Bluetooth */}
        <View style={styles.parametersSection}>
          <View style={styles.paramsHeaderRow}>
            <Text style={styles.paramsTitle}>Real-Time Sensor Readings</Text>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTagText}>LIVE HC-05</Text>
            </View>
          </View>

          <ParameterCard
            paramKey="pH"
            value={liveReading.pH}
          />
          <ParameterCard
            paramKey="tds"
            value={liveReading.tds}
          />
          <ParameterCard
            paramKey="conductivity"
            value={liveReading.conductivity}
          />
          <ParameterCard
            paramKey="turbidity"
            value={liveReading.turbidity}
          />
          <ParameterCard
            paramKey="temperature"
            value={liveReading.temperature}
          />
        </View>

        {/* Error State Banner if Sensor Unavailable */}
        {activeTestError && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={16} color={colors.unsafe} />
            <Text style={styles.errorText}>{activeTestError}</Text>
          </View>
        )}

        {/* Bottom CTA: Cancel Test */}
        <View style={styles.bottomActions}>
          <Button
            title="Cancel Test"
            variant="secondary"
            size="lg"
            onPress={handleCancel}
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  batteryChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  progressHeroSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.subtle,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  outerTrack: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
  },
  innerCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  progressSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collectingHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  stageDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  parametersSection: {
    marginBottom: 20,
  },
  paramsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paramsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 4,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.unsafeLight,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.unsafeBorder,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.unsafeText,
    marginLeft: 8,
    flex: 1,
  },
  bottomActions: {
    marginTop: 4,
  },
});
