import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { colors, typography, radius } from '../theme';
import { Icon } from '../components/Icon';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Subtle topographic / water contour background rings */}
      <View style={styles.backgroundRings}>
        <View style={[styles.ring, { width: width * 1.5, height: width * 1.5 }]} />
        <View style={[styles.ring, { width: width * 1.15, height: width * 1.15 }]} />
        <View style={[styles.ring, { width: width * 0.8, height: width * 0.8 }]} />
      </View>

      <View style={styles.content}>
        {/* SafeSip Brand Mark */}
        <View style={styles.logoBadge}>
          <View style={styles.logoInner}>
            <Icon name="droplet" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.brandTitle}>SafeSip</Text>
        <Text style={styles.tagline}>Smart Water. Safer Lives.</Text>

        <View style={styles.versionChip}>
          <Text style={styles.versionText}>IoT Health & Physicochemical Telemetry</Text>
        </View>
      </View>

      {/* Loading Indicator */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing sensors & offline cache…</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  backgroundRings: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.08)',
  },
  content: {
    alignItems: 'center',
    marginTop: 140,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  versionChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
    fontWeight: '500',
  },
});
