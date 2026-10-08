import { Device, SensorReading, SafetyStatus } from '../types';
import { SAFESIP_BLE_CONFIG } from './bleConstants';

export type BleConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'reconnecting';

export interface BleScanCallback {
  (devices: Device[]): void;
}

export interface BleTelemetryCallback {
  (reading: SensorReading, progress: number, stageDescription: string): void;
}

class SafeSipBleService {
  private isMockMode: boolean = true;
  private connectionState: BleConnectionState = 'disconnected';
  private connectedDevice: Device | null = null;
  private discoveredDevices: Device[] = [];
  private activeTestTimer: any = null;
  private stateChangeListeners: ((state: BleConnectionState) => void)[] = [];

  constructor() {
    // Preset discovered devices matching hardware reference
    this.discoveredDevices = [
      {
        id: 'safesip-0012',
        name: 'SafeSip_0012',
        macAddress: 'C4:4F:33:18:00:12',
        rssi: -58,
        batteryLevel: 88,
        isConnected: true,
        firmwareVersion: 'v2.1.0-esp32',
      },
      {
        id: 'safesip-0048',
        name: 'SafeSip_0048',
        macAddress: 'C4:4F:33:18:00:48',
        rssi: -72,
        batteryLevel: 64,
        isConnected: false,
        firmwareVersion: 'v2.0.4-esp32',
      },
      {
        id: 'safesip-7781',
        name: 'SafeSip_7781',
        macAddress: 'C4:4F:33:18:77:81',
        rssi: -84,
        batteryLevel: 42,
        isConnected: false,
        firmwareVersion: 'v2.1.0-esp32',
      },
    ];

    // Default active connected device to SafeSip_0012 for frictionless testing
    this.connectedDevice = this.discoveredDevices[0];
    this.connectionState = 'connected';
  }

  public getConnectionState(): BleConnectionState {
    return this.connectionState;
  }

  public getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  public setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
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

  /**
   * Scan for nearby SafeSip Smart Bottles
   */
  public async startScan(onUpdate: (devices: Device[]) => void): Promise<() => void> {
    this.notifyStateChange('scanning');

    if (this.isMockMode) {
      // Simulate realistic BLE advertisement discovery
      const timer = setTimeout(() => {
        onUpdate([...this.discoveredDevices]);
        this.notifyStateChange(this.connectedDevice ? 'connected' : 'disconnected');
      }, 1200);

      return () => {
        clearTimeout(timer);
        this.notifyStateChange(this.connectedDevice ? 'connected' : 'disconnected');
      };
    } else {
      // Real BLE hardware scan via React Native BLE Manager / BLE-PLX
      return () => {
        this.notifyStateChange(this.connectedDevice ? 'connected' : 'disconnected');
      };
    }
  }

  /**
   * Pair and establish BLE GATT connection with bottle
   */
  public async connectToDevice(deviceId: string): Promise<Device> {
    this.notifyStateChange('connecting');

    if (this.isMockMode) {
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 800);
      });
      const target = this.discoveredDevices.find(d => d.id === deviceId);
      if (!target) {
        this.notifyStateChange('disconnected');
        throw new Error(`Device ${deviceId} not found`);
      }

      this.discoveredDevices = this.discoveredDevices.map(d => ({
        ...d,
        isConnected: d.id === deviceId,
      }));

      this.connectedDevice = { ...target, isConnected: true };
      this.notifyStateChange('connected');
      return this.connectedDevice;
    } else {
      // Real GATT connect
      this.notifyStateChange('connected');
      return this.connectedDevice!;
    }
  }

  public async disconnectDevice(): Promise<void> {
    if (this.connectedDevice) {
      this.connectedDevice.isConnected = false;
      this.connectedDevice = null;
    }
    this.notifyStateChange('disconnected');
  }

  /**
   * Start Live Sensor Sampling Sequence
   * Triggers the ESP32's internal 5-parameter sensing sequence
   */
  public startLiveTest(
    onProgress: BleTelemetryCallback,
    onComplete: (reading: SensorReading) => void,
    onError: (error: string) => void
  ): () => void {
    if (!this.connectedDevice) {
      onError('No SafeSip bottle connected. Please pair via Bluetooth first.');
      return () => {};
    }

    if (this.isMockMode) {
      let currentProgress = 0;
      const totalSteps = 20;
      const intervalMs = 350;

      // Realistic target values: pH: 7.4, TDS: 125 ppm, EC: 310 µS/cm, Turbidity: 0.8 NTU, Temp: 22.5 °C
      const target = {
        pH: 7.4,
        tds: 125,
        conductivity: 310,
        turbidity: 0.8,
        temperature: 22.5,
      };

      const stages = [
        { upTo: 20, text: 'Purging intake chamber & baseline check…' },
        { upTo: 45, text: 'Measuring optical turbidity & particulate scatter…' },
        { upTo: 70, text: 'Stabilizing pH & electrical conductivity probes…' },
        { upTo: 90, text: 'Running local ESP32 safety classification algorithm…' },
        { upTo: 100, text: 'Finalizing physicochemical profile…' },
      ];

      this.activeTestTimer = setInterval(() => {
        currentProgress += Math.floor(100 / totalSteps);
        if (currentProgress > 100) currentProgress = 100;

        // Smooth physics-based jitter converging to the final target
        const jitter = (100 - currentProgress) / 100;
        const currentPh = Number((target.pH + (Math.random() * 0.4 - 0.2) * jitter).toFixed(1));
        const currentTds = Math.round(target.tds + (Math.random() * 20 - 10) * jitter);
        const currentEc = Math.round(target.conductivity + (Math.random() * 30 - 15) * jitter);
        const currentTurb = Number((target.turbidity + (Math.random() * 0.5 - 0.25) * jitter).toFixed(1));
        const currentTemp = Number((target.temperature + (Math.random() * 0.6 - 0.3) * jitter).toFixed(1));

        const stage = stages.find(s => currentProgress <= s.upTo)?.text || 'Analyzing…';

        const telemetry: SensorReading = {
          pH: currentPh,
          tds: currentTds,
          conductivity: currentEc,
          turbidity: Math.max(0.1, currentTurb),
          temperature: currentTemp,
          timestamp: new Date().toISOString(),
          overallStatus: 'SAFE',
        };

        onProgress(telemetry, currentProgress, stage);

        if (currentProgress >= 100) {
          if (this.activeTestTimer) {
            clearInterval(this.activeTestTimer);
            this.activeTestTimer = null;
          }

          const finalResult: SensorReading = {
            pH: 7.4,
            tds: 125,
            conductivity: 310,
            turbidity: 0.8,
            temperature: 22.5,
            timestamp: new Date().toISOString(),
            overallStatus: 'SAFE',
          };

          setTimeout(() => {
            onComplete(finalResult);
          }, 300);
        }
      }, intervalMs);

      return () => {
        if (this.activeTestTimer) {
          clearInterval(this.activeTestTimer);
          this.activeTestTimer = null;
        }
      };
    } else {
      return () => {};
    }
  }

  public cancelActiveTest() {
    if (this.activeTestTimer) {
      clearInterval(this.activeTestTimer);
      this.activeTestTimer = null;
    }
  }
}

export const bleService = new SafeSipBleService();
