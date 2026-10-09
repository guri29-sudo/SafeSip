import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { BottomNavBar } from '../components/BottomNavBar';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { OfflineBanner } from '../components/OfflineBanner';

// 11 Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ConnectDeviceScreen } from '../screens/ConnectDeviceScreen';
import { LiveTestingScreen } from '../screens/LiveTestingScreen';
import { TestResultsScreen } from '../screens/TestResultsScreen';
import { CommunityMapScreen } from '../screens/CommunityMapScreen';
import { SourceDetailsScreen } from '../screens/SourceDetailsScreen';
import { TestHistoryScreen } from '../screens/TestHistoryScreen';

import { WaterSource, WaterTest } from '../types';

export type ScreenName =
  | 'splash'
  | 'onboarding'
  | 'signup'
  | 'login'
  | 'main'
  | 'connect_device'
  | 'live_testing'
  | 'test_results'
  | 'source_details';

export const RootNavigator: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    logout,
    activeTab,
    setActiveTab,
    connectedDevice,
    isOffline,
    setOfflineMode,
    syncQueue,
    triggerSync,
    isSyncing,
  } = useAppStore();

  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash');
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [activeTestResult, setActiveTestResult] = useState<WaterTest | null>(null);

  // Navigation handlers
  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  // Render Profile View for the Profile Bottom Tab
  const renderProfileTab = () => (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title="Profile & Bottle Settings" />
      <OfflineBanner
        isOffline={isOffline}
        pendingCount={syncQueue.length}
        onSyncPress={triggerSync}
        isSyncing={isSyncing}
      />
      <ScrollView contentContainerStyle={styles.profileContainer}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {currentUser?.fullName ? currentUser.fullName[0] : 'V'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser?.fullName || 'Vedant'}</Text>
            <Text style={styles.userEmail}>{currentUser?.email || 'vedant@safesip.org'}</Text>
            <Text style={styles.userPhone}>{currentUser?.phone || '+1 (555) 382-9901'}</Text>
          </View>
        </View>

        {/* Device Settings Card */}
        <Text style={styles.sectionHeading}>Hardware Configuration</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigateTo('connect_device')}
          >
            <View style={styles.settingRowLeft}>
              <Icon name="bluetooth" size={18} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.settingTitle}>Bluetooth Device</Text>
                <Text style={styles.settingSubtitle}>
                  {connectedDevice ? `${connectedDevice.name} (Connected)` : 'No bottle paired'}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setOfflineMode(!isOffline);
              Alert.alert(
                'Offline Mode',
                !isOffline
                  ? 'Simulated Offline Mode enabled. New readings will be queued locally for offline sync.'
                  : 'Online mode enabled. SafeSip connected to Supabase cloud.'
              );
            }}
          >
            <View style={styles.settingRowLeft}>
              <Icon name={isOffline ? 'wifi-off' : 'wifi'} size={18} color={isOffline ? colors.cautionText : colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.settingTitle}>Offline Mode</Text>
                <Text style={styles.settingSubtitle}>
                  {isOffline ? 'Offline (Local SQLite Queue Active)' : 'Online (Direct Supabase Sync)'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggleIndicator,
                isOffline && { backgroundColor: colors.caution },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Sync Settings */}
        <Text style={styles.sectionHeading}>Sync & Storage</Text>
        <View style={styles.settingsCard}>
          <View style={styles.syncStatsRow}>
            <View>
              <Text style={styles.syncStatsTitle}>Offline Queue Items</Text>
              <Text style={styles.syncStatsSubtitle}>
                {syncQueue.length === 0
                  ? 'All local tests are synchronized with Supabase'
                  : `${syncQueue.length} test reading(s) awaiting upload`}
              </Text>
            </View>
            {syncQueue.length > 0 && (
              <Button
                title={isSyncing ? 'Syncing…' : 'Sync Now'}
                size="sm"
                variant="outline"
                loading={isSyncing}
                onPress={triggerSync}
                fullWidth={false}
              />
            )}
          </View>
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="secondary"
          size="md"
          onPress={() => {
            logout();
            navigateTo('login');
          }}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );

  // Screen Dispatcher
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onFinish={() => {
              navigateTo(isAuthenticated ? 'main' : 'onboarding');
            }}
          />
        );

      case 'onboarding':
        return (
          <OnboardingScreen
            onGetStarted={() => navigateTo('signup')}
            onLoginPress={() => navigateTo('login')}
          />
        );

      case 'signup':
        return (
          <SignUpScreen
            onSuccess={() => navigateTo('main')}
            onNavigateToLogin={() => navigateTo('login')}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onSuccess={() => navigateTo('main')}
            onNavigateToSignUp={() => navigateTo('signup')}
          />
        );

      case 'connect_device':
        return (
          <ConnectDeviceScreen
            onBack={() => navigateTo('main')}
          />
        );

      case 'live_testing':
        return (
          <LiveTestingScreen
            onCancel={() => navigateTo('main')}
            onComplete={result => {
              setActiveTestResult(result);
              navigateTo('test_results');
            }}
          />
        );

      case 'test_results':
        return (
          <TestResultsScreen
            testResult={activeTestResult}
            onSave={() => {
              setActiveTab('history');
              navigateTo('main');
            }}
            onBack={() => navigateTo('main')}
          />
        );

      case 'source_details':
        return selectedSource ? (
          <SourceDetailsScreen
            source={selectedSource}
            onBack={() => navigateTo('main')}
            onViewOnMap={() => {
              setActiveTab('map');
              navigateTo('main');
            }}
            onStartTestAtSource={() => navigateTo('live_testing')}
          />
        ) : (
          <HomeScreen
            onNavigateToTest={() => navigateTo('live_testing')}
            onNavigateToConnect={() => navigateTo('connect_device')}
            onNavigateToMap={() => setActiveTab('map')}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        );

      case 'main':
      default:
        // Main Tab Shell
        return (
          <View style={styles.mainShell}>
            <View style={styles.tabContentArea}>
              {activeTab === 'home' && (
                <HomeScreen
                  onNavigateToTest={() => navigateTo('live_testing')}
                  onNavigateToConnect={() => navigateTo('connect_device')}
                  onNavigateToMap={() => setActiveTab('map')}
                  onNavigateToHistory={() => setActiveTab('history')}
                />
              )}

              {activeTab === 'map' && (
                <CommunityMapScreen
                  onSelectSource={source => {
                    setSelectedSource(source);
                    navigateTo('source_details');
                  }}
                />
              )}

              {activeTab === 'history' && (
                <TestHistoryScreen
                  onSelectTest={test => {
                    setActiveTestResult(test);
                    navigateTo('test_results');
                  }}
                />
              )}

              {activeTab === 'profile' && renderProfileTab()}
            </View>

            {/* Persistent Bottom Navigation Bar */}
            <BottomNavBar
              activeTab={activeTab}
              onTabPress={tab => setActiveTab(tab)}
            />
          </View>
        );
    }
  };

  return <View style={styles.container}>{renderCurrentScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainShell: {
    flex: 1,
  },
  tabContentArea: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadows.subtle,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.subtle,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  toggleIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.safe,
  },
  syncStatsRow: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  syncStatsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
