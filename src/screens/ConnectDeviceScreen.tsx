import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Device } from '../types';

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
    disconnectBleDevice,
  } = useAppStore();

  const [connectingId, setConnectingId] = useState<string | null>(null);

  const isScanning = bleState === 'scanning';

  const handleDevicePress = async (device: Device) => {
    if (device.isConnected) {
      await disconnectBleDevice();
    } else {
      setConnectingId(device.id);
      await connectBleDevice(device.id);
      setConnectingId(null);
    }
  };

  const getRssiQuality = (rssi: number) => {
    if (rssi >= -65) return { label: 'Strong', bars: 3 };
    if (rssi >= -80) return { label: 'Good', bars: 2 };
    return { label: 'Fair', bars: 1 };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Connect Device"
        subtitle="Pair your SafeSip bottle via Bluetooth"
        onBack={onBack}
        rightAction={
          isScanning ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={startBleScan} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="refresh-cw" size={18} color={colors.primary} />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    bleState === 'connected'
                      ? colors.safe
                      : bleState === 'scanning'
                      ? colors.primary
                      : colors.caution,
                },
              ]}
            />
            <Text style={styles.statusTitle}>
              {bleState === 'connected'
                ? 'Bottle Connected'
                : bleState === 'scanning'
                ? 'Scanning for Nearby Bottles…'
                : 'Bluetooth Ready'}
            </Text>
          </View>

          <Text style={styles.statusSub}>GATT UUID: 4fafc201</Text>
        </View>

        {/* Currently Connected Device Card */}
        {connectedDevice && (
          <View style={styles.connectedCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Icon name="bluetooth" size={18} color={colors.primary} />
              </View>
              <View style={styles.deviceMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.deviceName}>{connectedDevice.name}</Text>
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedBadgeText}>Connected</Text>
                  </View>
                </View>
                <Text style={styles.macAddress}>{connectedDevice.macAddress}</Text>
              </View>
            </View>

            <View style={styles.deviceSpecsGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Battery</Text>
                <Text style={styles.specValue}>{connectedDevice.batteryLevel}%</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Signal (RSSI)</Text>
                <Text style={styles.specValue}>{connectedDevice.rssi} dBm</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Firmware</Text>
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
          </View>
        )}

        {/* Discovered Devices Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Discovered Devices</Text>
          {isScanning && (
            <View style={styles.scanningPill}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.scanningText}>Scanning</Text>
            </View>
          )}
        </View>

        <View style={styles.deviceList}>
          {discoveredDevices.map(device => {
            const signal = getRssiQuality(device.rssi);
            const isTargetConnecting = connectingId === device.id;

            return (
              <View key={device.id} style={styles.deviceRow}>
                <View style={styles.deviceLeftInfo}>
                  <View
                    style={[
                      styles.deviceRowIcon,
                      device.isConnected && styles.deviceRowIconActive,
                    ]}
                  >
                    <Icon
                      name="bluetooth"
                      size={16}
                      color={device.isConnected ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View>
                    <Text style={styles.deviceRowName}>{device.name}</Text>
                    <View style={styles.signalRow}>
                      <Text style={styles.signalLabel}>
                        {device.isConnected ? 'Paired active' : 'Available'} • {signal.label} ({device.rssi} dBm)
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionCol}>
                  {device.isConnected ? (
                    <View style={styles.activeTag}>
                      <Icon name="check" size={12} color={colors.safeText} />
                      <Text style={styles.activeTagText}>Connected</Text>
                    </View>
                  ) : (
                    <Button
                      title="Pair"
                      variant="outline"
                      size="sm"
                      loading={isTargetConnecting}
                      onPress={() => handleDevicePress(device)}
                      fullWidth={false}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Pairing Instructions & Troubleshooting */}
        <View style={styles.troubleCard}>
          <View style={styles.troubleHeader}>
            <Icon name="info" size={15} color={colors.textSecondary} />
            <Text style={styles.troubleTitle}>Pairing Guidelines</Text>
          </View>
          <Text style={styles.troubleText}>
            1. Ensure SafeSip smart bottle is powered ON with the blue LED pulsing.{'\n'}
            2. Hold bottle within 2 meters of your smartphone.{'\n'}
            3. Grant Bluetooth Low Energy and Location permissions when requested.
          </Text>
        </View>

        {/* Scan Again Button */}
        <Button
          title={isScanning ? 'Scanning…' : 'Scan for Devices'}
          onPress={startBleScan}
          disabled={isScanning}
          variant="secondary"
          size="md"
          icon="refresh-cw"
          style={{ marginTop: 8 }}
        />
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
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  connectedCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 20,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  connectedBadge: {
    backgroundColor: colors.safeLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.safeText,
  },
  macAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  deviceSpecsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  specItem: {
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
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
  scanningPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  deviceList: {
    marginBottom: 20,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadows.subtle,
  },
  deviceLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceRowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceRowIconActive: {
    backgroundColor: colors.primaryLight,
  },
  deviceRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionCol: {
    marginLeft: 10,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.safeLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.safeText,
    marginLeft: 4,
  },
  troubleCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  troubleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  troubleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  troubleText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
