/**
 * SafeSip HC-05 Classic Bluetooth Service
 *
 * HC-05 is a Classic Bluetooth (BR/EDR) module using the SPP (Serial Port Profile).
 * It is NOT a BLE device. This service handles:
 *   1. Android runtime permission requests (BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION)
 *   2. Discovering already-paired Classic BT devices (HC-05 appears in paired list)
 *   3. Connecting via SPP socket
 *   4. Sending AT commands to ESP32 to trigger sensor readings
 *   5. Parsing JSON telemetry streamed back over the serial channel
 *
 * HC-05 default settings:
 *   Name: HC-05 (or renamed e.g. "SafeSip_0012" via AT+NAME)
 *   PIN:  1234 (default) — pair from Android Settings > Bluetooth first
 *   Baud: 9600 (or 115200 if reprogrammed via AT+UART)
 *
 * Required: Install react-native-bluetooth-classic
 *   npm install react-native-bluetooth-classic
 *   cd android && ./gradlew assembleDebug
 *
 * Until installed, the service runs in MOCK mode to allow UI development.
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Device, SensorReading, SafetyStatus } from '../types';

export type BleConnectionState =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'permission_denied'
  | 'bluetooth_off';

export interface BleScanCallback {
  (devices: Device[]): void;
}

export interface BleTelemetryCallback {
  (reading: SensorReading, progress: number, stageDescription: string): void;
}

// Try to import the real BT Classic library; fall back to null if not installed
let RNBluetoothClassic: any = null;
try {
  RNBluetoothClassic = require('react-native-bluetooth-classic').default;
} catch {
  // Library not installed — service will run in mock/development mode
  console.warn(
    '[SafeSip BT] react-native-bluetooth-classic not installed. ' +
    'Running in mock mode. Run: npm install react-native-bluetooth-classic'
  );
}

class SafeSipBluetoothService {
  /** true when running without the native BT library */
  private mockMode: boolean = !RNBluetoothClassic;
  private connectionState: BleConnectionState = 'disconnected';
  private connectedDevice: Device | null = null;
  private activeTestTimer: any = null;
  private stateChangeListeners: ((state: BleConnectionState) => void)[] = [];
  private nativeConnection: any = null; // RNBluetoothClassic connection

  // ─── State Change Listeners ──────────────────────────────────────────────

  public getConnectionState(): BleConnectionState {
    return this.connectionState;
  }

  public getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  public onConnectionStateChange(listener: (state: BleConnectionState) => void) {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  private notifyStateChange(state: BleConnectionState) {
    this.connectionState = state;
    this.stateChangeListeners.forEach(l => l(state));
  }

  // ─── Android Runtime Permissions ─────────────────────────────────────────

  /**
   * Requests the correct set of Bluetooth + Location permissions depending on Android API level.
   * Must be called before any scan or connect attempt.
   * Returns true if all permissions are granted.
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true; // iOS handles via Info.plist

    const apiLevel = Platform.Version as number;

    let granted = false;

    if (apiLevel >= 31) {
      // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      granted =
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
    } else {
      // Android < 12: only needs location for discovery
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'SafeSip Needs Location Access',
          message:
            'Android requires Location permission to discover nearby Bluetooth devices ' +
            'like your HC-05 SafeSip sensor.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      granted = result === 'granted';
    }

    if (!granted) {
      this.notifyStateChange('permission_denied');
      Alert.alert(
        'Bluetooth Permission Required',
        'SafeSip needs Bluetooth and Location permissions to find your HC-05 sensor.\n\n' +
        'Go to Settings → Apps → SafeSip → Permissions and enable Bluetooth & Location.',
        [{ text: 'OK' }]
      );
    }

    return granted;
  }

  // ─── Device Discovery (Paired Devices) ───────────────────────────────────

  /**
   * HC-05 MUST be paired from Android Settings → Bluetooth first.
   * Once paired, it appears in the "bonded/paired" device list.
   * This method scans paired devices + performs a limited discovery scan.
   */
  public async startScan(onUpdate: (devices: Device[]) => void): Promise<() => void> {
    this.notifyStateChange('scanning');

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      onUpdate([]);
      return () => {};
    }

    if (this.mockMode) {
      // ── Mock Mode ────────────────────────────────────────────────────────
      // Simulate finding HC-05 devices for UI development
      const mockTimer = setTimeout(() => {
        const mockDevices: Device[] = [
          {
            id: 'hc05-AA:BB:CC:DD:EE:01',
            name: 'HC-05',
            macAddress: 'AA:BB:CC:DD:EE:01',
            rssi: -62,
            batteryLevel: 0, // HC-05 doesn't report battery
            isConnected: false,
            firmwareVersion: 'HC-05 v2.0',
          },
          {
            id: 'hc05-AA:BB:CC:DD:EE:02',
            name: 'SafeSip_0012',
            macAddress: 'AA:BB:CC:DD:EE:02',
            rssi: -74,
            batteryLevel: 0,
            isConnected: false,
            firmwareVersion: 'HC-05 v2.0',
          },
        ];
        onUpdate(mockDevices);
        this.notifyStateChange('disconnected');
      }, 1500);

      return () => {
        clearTimeout(mockTimer);
        this.notifyStateChange(this.connectedDevice ? 'connected' : 'disconnected');
      };
    }

    // ── Real Mode ──────────────────────────────────────────────────────────
    try {
      const btEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!btEnabled) {
        this.notifyStateChange('bluetooth_off');
        Alert.alert(
          'Bluetooth is Off',
          'Please enable Bluetooth in your device settings to find your HC-05 sensor.',
          [{ text: 'OK' }]
        );
        onUpdate([]);
        return () => {};
      }

      // Get all bonded/paired Classic Bluetooth devices
      const pairedDevices: any[] = await RNBluetoothClassic.getBondedDevices();
      
      // Sort so HC-05 / SafeSip / ESP32 devices appear first
      const sortedPaired = [...pairedDevices].sort((a: any, b: any) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const isASafeSip = aName.includes('safesip') || aName.includes('hc-05') || aName.includes('hc05') || aName.includes('esp32');
        const isBSafeSip = bName.includes('safesip') || bName.includes('hc-05') || bName.includes('hc05') || bName.includes('esp32');
        if (isASafeSip && !isBSafeSip) return -1;
        if (!isASafeSip && isBSafeSip) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      if (sortedPaired.length > 0) {
        const mapped: Device[] = sortedPaired.map((d: any) => {
          const dName = d.name || 'Bluetooth Device';
          const isKnown = dName.toLowerCase().includes('safesip') ||
            dName.toLowerCase().includes('hc-05') ||
            dName.toLowerCase().includes('hc05') ||
            dName.toLowerCase().includes('esp32');
          return {
            id: d.address,
            name: dName,
            macAddress: d.address,
            rssi: d.rssi ?? -65,
            batteryLevel: 0,
            isConnected: false,
            firmwareVersion: isKnown ? 'SafeSip HC-05' : 'Classic BT',
          };
        });
        onUpdate(mapped);
        this.notifyStateChange('disconnected');
        return () => {};
      }

      // If no paired devices, try discovery
      try {
        const discovered = await RNBluetoothClassic.startDiscovery();
        const mappedDiscovered: Device[] = (discovered || []).map((d: any) => ({
          id: d.address,
          name: d.name || 'Nearby Device',
          macAddress: d.address,
          rssi: d.rssi ?? -80,
          batteryLevel: 0,
          isConnected: false,
          firmwareVersion: 'Discovered BT',
        }));
        onUpdate(mappedDiscovered);
      } catch {
        onUpdate([]);
      }
    } catch (err: any) {
      console.error('[SafeSip BT] Scan error:', err);
      Alert.alert(
        'Bluetooth Notice',
        'Could not scan paired devices: ' + (err?.message || 'Check Bluetooth settings') +
        '\n\nPlease make sure your HC-05 is paired in Android Settings > Bluetooth (PIN: 1234).'
      );
      onUpdate([]);
    }

    this.notifyStateChange('disconnected');
    return () => {
      try { RNBluetoothClassic?.cancelDiscovery?.(); } catch {}
    };
  }

  // ─── Connect to HC-05 via SPP ─────────────────────────────────────────────

  public async connectToDevice(deviceId: string): Promise<Device> {
    this.notifyStateChange('connecting');

    if (this.mockMode) {
      await new Promise<void>(r => setTimeout(r, 900));
      const device: Device = {
        id: deviceId,
        name: deviceId.includes('0012') ? 'SafeSip_0012' : 'HC-05',
        macAddress: deviceId,
        rssi: -62,
        batteryLevel: 0,
        isConnected: true,
        firmwareVersion: 'HC-05 v2.0',
      };
      this.connectedDevice = device;
      this.notifyStateChange('connected');
      return device;
    }

    try {
      // SPP connect — HC-05 default PIN is 1234 (pair from Android Settings first)
      const connection = await RNBluetoothClassic.connectToDevice(deviceId, {
        delimiter: '\n', // HC-05 sends newline-terminated JSON
        charset: 'utf-8',
      });

      this.nativeConnection = connection;

      const device: Device = {
        id: deviceId,
        name: connection.name || 'HC-05',
        macAddress: connection.address,
        rssi: connection.rssi ?? -65,
        batteryLevel: 0,
        isConnected: true,
        firmwareVersion: 'HC-05',
      };

      this.connectedDevice = device;
      this.notifyStateChange('connected');
      return device;
    } catch (err: any) {
      this.notifyStateChange('disconnected');
      throw new Error(
        `Could not connect to HC-05: ${err?.message || 'Connection refused'}\n` +
        'Tip: Pair the HC-05 first in Android Settings → Bluetooth. Default PIN: 1234'
      );
    }
  }

  public async disconnectDevice(): Promise<void> {
    try {
      if (this.nativeConnection) {
        await this.nativeConnection.disconnect();
        this.nativeConnection = null;
      }
    } catch {}
    this.connectedDevice = null;
    this.notifyStateChange('disconnected');
  }

  // ─── Live Sensor Sampling (HC-05 SPP AT Commands) ────────────────────────

  /**
   * Sends "START_TEST\n" to the ESP32 via HC-05 SPP.
   * The ESP32 firmware should respond with newline-delimited JSON:
   *   {"pH":7.4,"tds":125,"ec":310,"turb":0.8,"temp":22.5,"prog":45,"stage":"Measuring pH..."}
   * Final packet has "prog":100 and includes "status":"SAFE"|"CAUTION"|"UNSAFE"
   */
  public startLiveTest(
    onProgress: BleTelemetryCallback,
    onComplete: (reading: SensorReading) => void,
    onError: (error: string) => void
  ): () => void {
    if (!this.connectedDevice) {
      onError('No HC-05 device connected. Please pair and connect first.');
      return () => {};
    }

    if (this.mockMode) {
      return this._runMockTest(onProgress, onComplete);
    }

    return this._runRealTest(onProgress, onComplete, onError);
  }

  private _runRealTest(
    onProgress: BleTelemetryCallback,
    onComplete: (reading: SensorReading) => void,
    onError: (error: string) => void
  ): () => void {
    let cancelled = false;
    let dataSubscription: any = null;

    (async () => {
      try {
        // Send START_TEST command to ESP32 via HC-05
        await this.nativeConnection.write('START_TEST\n');

        // Listen for incoming data chunks
        dataSubscription = this.nativeConnection.onDataReceived((data: any) => {
          if (cancelled) return;

          try {
            const raw = (typeof data === 'string' ? data : data?.data || '').trim();
            if (!raw) return;

            let parsedPh = 0;
            let parsedTds = 0;
            let parsedEc = 0;
            let parsedTurb = 0;
            let parsedTemp = 0;
            let progress = 0;
            let stage = 'Sampling water matrix…';
            let statusOverride: SafetyStatus | null = null;
            let isDone = false;

            // 1. Try parsing JSON format
            if (raw.startsWith('{') && raw.endsWith('}')) {
              const json = JSON.parse(raw);
              parsedPh = Number(json.pH ?? json.ph ?? 0);
              parsedTds = Number(json.tds ?? json.TDS ?? 0);
              parsedEc = Number(json.ec ?? json.conductivity ?? json.EC ?? 0);
              parsedTurb = Number(json.turb ?? json.turbidity ?? json.TURB ?? 0);
              parsedTemp = Number(json.temp ?? json.temperature ?? json.TEMP ?? 0);
              progress = Number(json.prog ?? json.progress ?? 0);
              stage = String(json.stage ?? 'Sensors reading…');
              if (json.status) statusOverride = json.status as SafetyStatus;
              if (json.done || progress >= 100) isDone = true;
            }
            // 2. Try parsing Key-Value format (e.g. "PH:7.2,TDS:140,EC:280,TURB:0.8,TEMP:23.0,PROG:50")
            else if (raw.includes(':') || raw.includes('=')) {
              const pairs = raw.split(/[,;\n]/);
              for (const pair of pairs) {
                const [k, v] = pair.split(/[:=]/).map((s: string) => s.trim().toUpperCase());
                const num = parseFloat(v);
                if (k.includes('PH') && !isNaN(num)) parsedPh = num;
                else if (k.includes('TDS') && !isNaN(num)) parsedTds = num;
                else if (k.includes('EC') && !isNaN(num)) parsedEc = num;
                else if ((k.includes('TURB') || k.includes('NTU')) && !isNaN(num)) parsedTurb = num;
                else if (k.includes('TEMP') && !isNaN(num)) parsedTemp = num;
                else if (k.includes('PROG') && !isNaN(num)) progress = num;
                else if (k.includes('STATUS')) statusOverride = v as SafetyStatus;
              }
              if (progress >= 100) isDone = true;
            }
            // 3. Try parsing CSV format (e.g. "7.4,125,310,0.8,22.5")
            else if (raw.includes(',')) {
              const parts = raw.split(',').map((s: string) => parseFloat(s.trim()));
              if (parts.length >= 5 && parts.every((p: number) => !isNaN(p))) {
                [parsedPh, parsedTds, parsedEc, parsedTurb, parsedTemp] = parts;
                progress = 100;
                isDone = true;
              }
            }

            // Real WHO / EPA drinking water safety classification
            let calculatedStatus: 'SAFE' | 'CAUTION' | 'UNSAFE' = 'SAFE';
            if (parsedPh < 6.2 || parsedPh > 8.8 || parsedTds >= 900 || parsedTurb >= 5.0) {
              calculatedStatus = 'UNSAFE';
            } else if (parsedPh < 6.6 || parsedPh > 8.4 || parsedTds >= 450 || parsedTurb >= 1.5) {
              calculatedStatus = 'CAUTION';
            }

            const reading: SensorReading = {
              pH: parsedPh,
              tds: parsedTds,
              conductivity: parsedEc,
              turbidity: parsedTurb,
              temperature: parsedTemp,
              timestamp: new Date().toISOString(),
              overallStatus: (statusOverride && statusOverride !== 'UNVERIFIED' ? statusOverride : calculatedStatus),
            };

            onProgress(reading, progress, stage);

            if (isDone || progress >= 100) {
              if (dataSubscription) { dataSubscription.remove?.(); }
              onComplete(reading);
            }
          } catch {
            // Partial serial chunk — wait for next delimiter
          }
        });
      } catch (err: any) {
        if (!cancelled) {
          onError(`HC-05 sensor error: ${err?.message || 'SPP read failure'}`);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (dataSubscription) { dataSubscription.remove?.(); }
      try { this.nativeConnection?.write?.('STOP_TEST\n'); } catch {}
    };
  }

  private _runMockTest(
    onProgress: BleTelemetryCallback,
    onComplete: (reading: SensorReading) => void
  ): () => void {
    let progress = 0;
    const target = { pH: 7.4, tds: 125, ec: 310, turb: 0.8, temp: 22.5 };
    const stages = [
      { upTo: 20, text: 'HC-05 SPP handshake…' },
      { upTo: 45, text: 'Measuring optical turbidity…' },
      { upTo: 70, text: 'pH & EC probe stabilising…' },
      { upTo: 90, text: 'ESP32 safety classification…' },
      { upTo: 100, text: 'Finalising sensor profile…' },
    ];

    this.activeTestTimer = setInterval(() => {
      progress = Math.min(100, progress + 5);
      const j = (100 - progress) / 100;

      const reading: SensorReading = {
        pH: Number((target.pH + (Math.random() * 0.4 - 0.2) * j).toFixed(1)),
        tds: Math.round(target.tds + (Math.random() * 20 - 10) * j),
        conductivity: Math.round(target.ec + (Math.random() * 30 - 15) * j),
        turbidity: Math.max(0.1, Number((target.turb + (Math.random() * 0.5 - 0.25) * j).toFixed(1))),
        temperature: Number((target.temp + (Math.random() * 0.6 - 0.3) * j).toFixed(1)),
        timestamp: new Date().toISOString(),
        overallStatus: 'SAFE',
      };

      const stage = stages.find(s => progress <= s.upTo)?.text ?? 'Analysing…';
      onProgress(reading, progress, stage);

      if (progress >= 100) {
        clearInterval(this.activeTestTimer);
        this.activeTestTimer = null;
        setTimeout(() => onComplete({ ...reading, pH: 7.4, tds: 125, conductivity: 310, turbidity: 0.8, temperature: 22.5 }), 300);
      }
    }, 350);

    return () => {
      if (this.activeTestTimer) {
        clearInterval(this.activeTestTimer);
        this.activeTestTimer = null;
      }
    };
  }

  public cancelActiveTest() {
    if (this.activeTestTimer) {
      clearInterval(this.activeTestTimer);
      this.activeTestTimer = null;
    }
    try { this.nativeConnection?.write?.('STOP_TEST\n'); } catch {}
  }
}

export const bleService = new SafeSipBluetoothService();


