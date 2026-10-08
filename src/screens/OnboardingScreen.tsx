import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors, radius, typography, shadows, spacing } from '../theme';
import { Button } from '../components/Button';
import { Icon, IconName } from '../components/Icon';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLoginPress: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onGetStarted,
  onLoginPress,
}) => {
  const features: {
    title: string;
    description: string;
    icon: IconName;
    badge: string;
  }[] = [
    {
      title: 'Test Water Quality',
      description:
        'Instant multi-sensor analysis measuring pH, TDS, electrical conductivity, turbidity, and temperature via ESP32 BLE.',
      icon: 'activity',
      badge: '5 Parameters',
    },
    {
      title: 'Find Safe Sources',
      description:
        'Navigate nearby verified drinking water points, natural springs, and community filtration hubs on an interactive map.',
      icon: 'map-pin',
      badge: 'OpenStreetMap',
    },
    {
      title: 'Contribute to Community',
      description:
        'Enrich open water data by recording real-time tests from your travels with offline storage and automatic cloud synchronization.',
      icon: 'shield-check',
      badge: 'Open Source',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.iconBox}>
              <Icon name="droplet" size={20} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>SafeSip</Text>
          </View>
          <Text style={styles.headline}>Every drop verified, right from your bottle.</Text>
          <Text style={styles.subheadline}>
            A portable laboratory companion for outdoor exploration, clean water advocacy, and daily hydration security.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featureList}>
          {features.map((item, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.cardHeader}>
                <View style={styles.featureIcon}>
                  <Icon name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              </View>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.description}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={onGetStarted}
            size="lg"
            icon="arrow-right"
            iconPosition="right"
          />
          <View style={styles.loginRow}>
            <Text style={styles.alreadyText}>Already have an account? </Text>
            <Text style={styles.loginLink} onPress={onLoginPress}>
              Log In
            </Text>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  featureList: {
    marginBottom: 28,
  },
  featureCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  actions: {
    marginTop: 8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  alreadyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
