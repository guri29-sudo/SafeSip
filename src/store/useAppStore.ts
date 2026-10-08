import { create } from 'zustand';
import {
  User,
  Device,
  WaterTest,
  WaterSource,
  SensorReading,
  SafetyStatus,
  SyncQueueItem,
} from '../types';
import { dbService } from '../database/storageService';
import { bleService, BleConnectionState } from '../bluetooth/BleService';
import { syncWorker } from '../api/syncWorker';

interface AppState {
  // --- Auth ---
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password?: string) => Promise<boolean>;
  signUp: (fullName: string, email: string, phone: string, password?: string) => Promise<boolean>;
  logout: () => void;

  // --- Bluetooth Hardware ---
  connectedDevice: Device | null;
  discoveredDevices: Device[];
  bleState: BleConnectionState;
  startBleScan: () => Promise<void>;
  connectBleDevice: (deviceId: string) => Promise<void>;
  disconnectBleDevice: () => Promise<void>;

  // --- Live Testing ---
  isTesting: boolean;
  testProgress: number;
  testStage: string;
  liveReading: SensorReading;
  activeTestError: string | null;
  startLiveTest: (onCompleteNavigate?: (result: WaterTest) => void) => void;
  cancelLiveTest: () => void;
  lastCompletedTest: WaterTest | null;

  // --- Tests History ---
  tests: WaterTest[];
  historyFilter: 'ALL' | 'SAFE' | 'CAUTION' | 'UNSAFE';
  saveTestResult: (notes?: string, sourceName?: string) => WaterTest;
  setHistoryFilter: (filter: 'ALL' | 'SAFE' | 'CAUTION' | 'UNSAFE') => void;

  // --- Map & Community Sources ---
  sources: WaterSource[];
  selectedSourceId: string | null;
  mapSearchQuery: string;
  mapStatusFilter: 'ALL' | 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNVERIFIED';
  setSelectedSourceId: (id: string | null) => void;
  setMapSearchQuery: (query: string) => void;
  setMapStatusFilter: (filter: 'ALL' | 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNVERIFIED') => void;

  // --- Offline & Sync ---
  isOffline: boolean;
  setOfflineMode: (offline: boolean) => void;
  syncQueue: SyncQueueItem[];
  triggerSync: () => Promise<void>;
  isSyncing: boolean;

  // --- Active Tab Navigation ---
  activeTab: 'home' | 'map' | 'history' | 'profile';
  setActiveTab: (tab: 'home' | 'map' | 'history' | 'profile') => void;
}

const defaultSensorReading: SensorReading = {
  pH: 7.4,
  tds: 125,
  conductivity: 310,
  turbidity: 0.8,
  temperature: 22.5,
  timestamp: new Date().toISOString(),
  overallStatus: 'SAFE',
};

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  currentUser: dbService.getCurrentUser(),
  isAuthenticated: true, // Preset logged in as Vedant for seamless experience

  login: async (emailOrPhone, _password) => {
    const user: User = {
      id: 'usr-vedant-01',
      fullName: 'Vedant',
      email: emailOrPhone.includes('@') ? emailOrPhone : 'vedant@safesip.org',
      phone: emailOrPhone.includes('@') ? '+1 (555) 382-9901' : emailOrPhone,
      createdAt: new Date().toISOString(),
    };
    dbService.setCurrentUser(user);
    set({ currentUser: user, isAuthenticated: true });
    return true;
  },

  signUp: async (fullName, email, phone, _password) => {
    const user: User = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      phone,
      createdAt: new Date().toISOString(),
    };
    dbService.setCurrentUser(user);
    set({ currentUser: user, isAuthenticated: true });
    return true;
  },

  logout: () => {
    dbService.setCurrentUser(null);
    set({ currentUser: null, isAuthenticated: false });
  },

  // Bluetooth
  connectedDevice: bleService.getConnectedDevice(),
  discoveredDevices: [
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
  ],
  bleState: 'connected',

  startBleScan: async () => {
    set({ bleState: 'scanning' });
    await bleService.startScan(devices => {
      set({ discoveredDevices: devices });
    });
    set({ bleState: get().connectedDevice ? 'connected' : 'disconnected' });
  },

  connectBleDevice: async (deviceId: string) => {
    try {
      const device = await bleService.connectToDevice(deviceId);
      set({
        connectedDevice: device,
        bleState: 'connected',
        discoveredDevices: get().discoveredDevices.map(d => ({
          ...d,
          isConnected: d.id === deviceId,
        })),
      });
    } catch {
      set({ bleState: 'disconnected' });
    }
  },

  disconnectBleDevice: async () => {
    await bleService.disconnectDevice();
    set({
      connectedDevice: null,
      bleState: 'disconnected',
      discoveredDevices: get().discoveredDevices.map(d => ({
        ...d,
        isConnected: false,
      })),
    });
  },

  // Live Testing
  isTesting: false,
  testProgress: 0,
  testStage: 'Ready to test',
  liveReading: defaultSensorReading,
  activeTestError: null,
  lastCompletedTest: dbService.getLatestTest(),

  startLiveTest: onCompleteNavigate => {
    set({
      isTesting: true,
      testProgress: 0,
      testStage: 'Initializing ESP32 chamber…',
      activeTestError: null,
    });

    bleService.startLiveTest(
      (reading, progress, stage) => {
        set({
          liveReading: reading,
          testProgress: progress,
          testStage: stage,
        });
      },
      finalReading => {
        // Build completed WaterTest with phone GPS enrichment
        const newTest: WaterTest = {
          id: `test-${Date.now()}`,
          deviceId: get().connectedDevice?.id || 'safesip-0012',
          userId: get().currentUser?.id || 'usr-vedant-01',
          sourceName: 'Lake View Reservoir',
          latitude: 37.7749,
          longitude: -122.4194,
          locationName: 'North Basin, Shoreline Trail',
          timestamp: new Date().toISOString(),
          pH: finalReading.pH,
          tds: finalReading.tds,
          conductivity: finalReading.conductivity,
          turbidity: finalReading.turbidity,
          temperature: finalReading.temperature,
          safetyStatus: finalReading.overallStatus,
          syncStatus: get().isOffline ? 'pending' : 'synced',
        };

        dbService.saveTest(newTest);

        set({
          isTesting: false,
          testProgress: 100,
          testStage: 'Sampling complete',
          lastCompletedTest: newTest,
          tests: dbService.getAllTests(),
          sources: dbService.getAllSources(),
          syncQueue: dbService.getSyncQueue(),
        });

        if (onCompleteNavigate) {
          onCompleteNavigate(newTest);
        }
      },
      error => {
        set({ isTesting: false, activeTestError: error });
      }
    );
  },

  cancelLiveTest: () => {
    bleService.cancelActiveTest();
    set({ isTesting: false, testProgress: 0, testStage: 'Cancelled' });
  },

  // Tests History
  tests: dbService.getAllTests(),
  historyFilter: 'ALL',

  saveTestResult: (notes, sourceName) => {
    const last = get().lastCompletedTest;
    if (last) {
      if (notes) last.notes = notes;
      if (sourceName) last.sourceName = sourceName;
      set({ tests: dbService.getAllTests() });
      return last;
    }
    const fallback = dbService.getLatestTest()!;
    return fallback;
  },

  setHistoryFilter: filter => {
    set({ historyFilter: filter });
  },

  // Map & Sources
  sources: dbService.getAllSources(),
  selectedSourceId: null,
  mapSearchQuery: '',
  mapStatusFilter: 'ALL',

  setSelectedSourceId: id => {
    set({ selectedSourceId: id });
  },

  setMapSearchQuery: query => {
    set({ mapSearchQuery: query });
  },

  setMapStatusFilter: filter => {
    set({ mapStatusFilter: filter });
  },

  // Offline & Sync
  isOffline: false,
  syncQueue: dbService.getSyncQueue(),
  isSyncing: false,

  setOfflineMode: offline => {
    dbService.setOfflineMode(offline);
    set({ isOffline: offline });
  },

  triggerSync: async () => {
    set({ isSyncing: true });
    await syncWorker.syncPendingQueue();
    set({
      isSyncing: false,
      tests: dbService.getAllTests(),
      syncQueue: dbService.getSyncQueue(),
    });
  },

  // Active Navigation Tab
  activeTab: 'home',
  setActiveTab: tab => {
    set({ activeTab: tab });
  },
}));
