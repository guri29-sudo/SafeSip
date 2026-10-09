import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Device } from '../types';
import { bleService } from '../bluetooth/BleService';

interface ConnectDeviceScreenProps {
  onBack: () => void;
}

export const ConnectDeviceScreen: React.FC<ConnectDeviceScreenProps> = ({ onBack }) => {
  const {
    connectedDevice,
    discoveredDevices,
    bleState,
    startBleScan,
    connectBleDevice,
    connectSimulatedDevice,
    disconnectBleDevice,
  } = useAppStore();

  const handleConnectSimulator = () => {
    connectSimulatedDevice();
    onBack();
  };

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [hasScannedOnce, setHasScannedOnce] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const isScanning = bleState === 'scanning';
  const isConnecting = bleState === 'connecting';
  const permDenied = bleState === 'permission_denied';
  const btOff = bleState === 'bluetooth_off';

  const handleScan = async () => {
    setHasScannedOnce(true);
    await startBleScan();
  };

  const handleDevicePress = async (device: Device) => {
    if (device.isConnected) {
      Alert.alert('Disconnect', `Disconnect from ${device.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectBleDevice(),
        },
      ]);
    } else {
      setConnectingId(device.id);
      try {
        await connectBleDevice(device.id);
      } catch (err: any) {
        Alert.alert('Connection Failed', err?.message || 'Could not connect to HC-05.');
      } finally {
        setConnectingId(null);
      }
    }
  };

  const openSettings = () => Linking.openSettings();

  const getRssiLabel = (rssi: number) => {
    if (rssi >= -65) return 'Strong';
    if (rssi >= -80) return 'Good';
    return 'Fair';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <Header
        title="Connect HC-05"
        subtitle="Pair your SafeSip sensor via Classic Bluetooth"
        onBack={onBack}
        rightAction={
          isScanning ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity
              onPress={handleScan}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="refresh-cw" size={18} color={colors.primary} />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Status Banner ────────────────────────────────────────────── */}
        <Animated.View style={[styles.statusBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    bleState === 'connected' ? colors.safe :
                    bleState === 'scanning' || bleState === 'connecting' ? colors.primary :
                    permDenied || btOff ? colors.unsafe : colors.caution,
                },
              ]}
            />
            <Text style={styles.statusTitle}>
              {bleState === 'connected' ? `Connected to ${connectedDevice?.name}` :
               bleState === 'scanning' ? 'Scanning for HC-05…' :
               bleState === 'connecting' ? 'Connecting via SPP…' :
               permDenied ? 'Permission Denied' :
               btOff ? 'Bluetooth is Off' :
               'Ready to Scan'}
            </Text>
          </View>
          <View style={[styles.protocolBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.protocolText}>Classic BT • SPP</Text>
          </View>
        </Animated.View>

        {/* ── Permission Denied State ──────────────────────────────────── */}
        {permDenied && (
          <View style={styles.alertCard}>
            <Icon name="alert-circle" size={20} color={colors.unsafe} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.alertTitle}>Bluetooth Permission Required</Text>
              <Text style={styles.alertBody}>
                SafeSip needs Bluetooth and Location permissions to find your HC-05.
              </Text>
            </View>
            <TouchableOpacity onPress={openSettings} style={styles.settingsBtn}>
              <Text style={styles.settingsBtnText}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bluetooth Off State ──────────────────────────────────────── */}
        {btOff && (
          <View style={[styles.alertCard, { borderColor: colors.cautionBorder }]}>
            <Icon name="bluetooth" size={20} color={colors.caution} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.alertTitle}>Bluetooth is Disabled</Text>
              <Text style={styles.alertBody}>
                Enable Bluetooth in your device settings to connect the HC-05 sensor.
              </Text>
            </View>
          </View>
        )}

        {/* ── Connected Device Card ─────────────────────────────────────── */}
        {connectedDevice && (
          <Animated.View style={[styles.connectedCard, { opacity: fadeAnim }]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Icon name="bluetooth" size={18} color={colors.primary} />
              </View>
              <View style={styles.deviceMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.deviceName}>{connectedDevice.name}</Text>
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedBadgeText}>● Connected</Text>
                  </View>
                </View>
                <Text style={styles.macAddress}>{connectedDevice.macAddress}</Text>
              </View>
            </View>

            <View style={styles.deviceSpecsGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Protocol</Text>
                <Text style={styles.specValue}>SPP</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Signal</Text>
                <Text style={styles.specValue}>{connectedDevice.rssi} dBm</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Module</Text>
                <Text style={styles.specValue}>{connectedDevice.firmwareVersion}</Text>
              </View>
            </View>

            <Button
              title="Disconnect"
              variant="secondary"
              size="sm"
              onPress={() => disconnectBleDevice()}
              style={{ marginTop: 12 }}
            />
          </Animated.View>
        )}

        {/* ── Discovered Devices ────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {isScanning ? 'Scanning…' : 'Paired HC-05 Devices'}
          </Text>
          {isScanning && (
            <View style={styles.scanningPill}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.scanningText}>Searching</Text>
            </View>
          )}
        </View>

        <View style={styles.deviceList}>
          {discoveredDevices.length === 0 && hasScannedOnce && !isScanning ? (
            <View style={styles.emptyState}>
              <Icon name="bluetooth" size={28} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No HC-05 Found</Text>
              <Text style={styles.emptySub}>
                Make sure you've paired the HC-05 in{'\n'}
                <Text style={{ fontWeight: '700' }}>Android Settings → Bluetooth</Text>{'\n'}
                then tap Scan below.
              </Text>
            </View>
          ) : (
            discoveredDevices.map(device => {
              const isTargetConnecting = connectingId === device.id;
              const rssiLabel = getRssiLabel(device.rssi);
              return (
                <TouchableOpacity
                  key={device.id}
                  activeOpacity={0.75}
                  onPress={() => handleDevicePress(device)}
                  style={[styles.deviceRow, device.isConnected && styles.deviceRowActive]}
                >
                  <View style={styles.deviceLeftInfo}>
                    <View style={[styles.deviceRowIcon, device.isConnected && styles.deviceRowIconActive]}>
                      {isTargetConnecting ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Icon
                          name="bluetooth"
                          size={16}
                          color={device.isConnected ? colors.primary : colors.textMuted}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deviceRowName}>{device.name}</Text>
                      <Text style={styles.signalLabel}>
                        {device.isConnected
                          ? '● Connected via SPP'
                          : `${rssiLabel} signal · ${device.rssi} dBm · Classic BT`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionCol}>
                    {device.isConnected ? (
                      <View style={styles.activeTag}>
                        <Icon name="check" size={12} color={colors.safeText} />
                        <Text style={styles.activeTagText}>Active</Text>
                      </View>
                    ) : isTargetConnecting ? (
                      <Text style={styles.connectingText}>Connecting…</Text>
                    ) : (
                      <View style={styles.pairBtn}>
                        <Text style={styles.pairBtnText}>Pair</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── HC-05 Pairing Guide ──────────────────────────────────────── */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Icon name="info" size={15} color={colors.primary} />
            <Text style={styles.guideTitle}>HC-05 Setup Guide</Text>
          </View>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>1. </Text>
            Power on the HC-05 module (LED should blink rapidly)
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>2. </Text>
            Open <Text style={{ fontWeight: '700' }}>Android Settings → Bluetooth</Text> and pair HC-05
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>3. </Text>
            Default PIN: <Text style={{ fontWeight: '700', fontFamily: 'monospace' }}>1234</Text> (or 0000)
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>4. </Text>
            Return here and tap <Text style={{ fontWeight: '700' }}>Scan for Devices</Text>
          </Text>
          {Platform.OS === 'android' && (
            <Text style={styles.guideStep}>
              <Text style={styles.stepNum}>5. </Text>
              Grant Bluetooth + Location permissions when prompted
            </Text>
          )}
        </View>

        {/* ── Scan Button ──────────────────────────────────────────────── */}
        <Button
          title={isScanning ? 'Scanning for HC-05…' : 'Scan for Devices'}
          onPress={handleScan}
          disabled={isScanning || isConnecting}
          variant={hasScannedOnce && discoveredDevices.length === 0 && !isScanning ? 'primary' : 'secondary'}
          size="md"
          icon="refresh-cw"
          style={{ marginTop: 8 }}
        />
        {/* ── Simulator Button (testing without real HC-05) ─────────────── */}
        <Button
          title="🧪 Connect Simulator (No Real Hardware)"
          variant="secondary"
          onPress={handleConnectSimulator}
          size="md"
          style={{ marginTop: 10, opacity: 0.85 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },

  statusBanner: {
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
  statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  protocolBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  protocolText: { fontSize: 10, fontWeight: '700', color: colors.primary },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.unsafeLight,
    borderWidth: 1,
    borderColor: colors.unsafeBorder,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  alertBody: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  settingsBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.unsafe, borderRadius: radius.xs },
  settingsBtnText: { fontSize: 11, fontWeight: '700', color: colors.white },

  connectedCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 20,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  deviceMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deviceName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  connectedBadge: { backgroundColor: colors.safeLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  connectedBadgeText: { fontSize: 11, fontWeight: '700', color: colors.safeText },
  macAddress: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: 'monospace' },
  deviceSpecsGrid: {
    flexDirection: 'row', backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  specItem: { alignItems: 'center' },
  specLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  scanningPill: { flexDirection: 'row', alignItems: 'center' },
  scanningText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  deviceList: { marginBottom: 20 },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 32,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 10, marginBottom: 4 },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  deviceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, padding: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8, ...shadows.subtle,
  },
  deviceRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  deviceLeftInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceRowIcon: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  deviceRowIconActive: { backgroundColor: colors.primaryLight },
  deviceRowName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  signalLabel: { fontSize: 11, color: colors.textSecondary },
  actionCol: { marginLeft: 10 },
  activeTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.safeLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs,
  },
  activeTagText: { fontSize: 11, fontWeight: '700', color: colors.safeText, marginLeft: 4 },
  connectingText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  pairBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.sm,
  },
  pairBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },

  guideCard: {
    backgroundColor: colors.primarySubtle, padding: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primaryLight, marginBottom: 16,
  },
  guideHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  guideTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 6 },
  guideStep: { fontSize: 12, color: colors.textSecondary, lineHeight: 20, marginBottom: 2 },
  stepNum: { fontWeight: '700', color: colors.primary },
});
