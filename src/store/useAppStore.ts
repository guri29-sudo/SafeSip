import { create } from 'zustand';
import {
  User,
  Device,
  WaterTest,
  WaterSource,
  SensorReading,
  SyncQueueItem,
} from '../types';
import { dbService } from '../database/storageService';
import { bleService, BleConnectionState } from '../bluetooth/BleService';
import { syncWorker } from '../api/syncWorker';
import { supabase, isSupabaseConfigured } from '../api/supabaseClient';

interface AppState {
  // --- Auth ---
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password?: string) => Promise<boolean>;
  loginOffline: (name?: string) => Promise<boolean>;
  signUp: (fullName: string, email: string, phone: string, password?: string) => Promise<boolean>;
  logout: () => void;

  // --- Bluetooth Hardware ---
  connectedDevice: Device | null;
  discoveredDevices: Device[];
  bleState: BleConnectionState; // 'disconnected'|'scanning'|'connecting'|'connected'|'permission_denied'|'bluetooth_off'
  startBleScan: () => Promise<void>;
  connectBleDevice: (deviceId: string) => Promise<void>;
  connectSimulatedDevice: () => void;
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
  loadUserSources: () => Promise<void>;
  subscribeToRealtimeSources: () => () => void;

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
  pH: 0,
  tds: 0,
  conductivity: 0,
  turbidity: 0,
  temperature: 0,
  timestamp: new Date().toISOString(),
  overallStatus: 'SAFE',
};

export const useAppStore = create<AppState>((set, get) => ({
  // Auth — start unauthenticated; user must log in for real
  currentUser: dbService.getCurrentUser(),
  isAuthenticated: dbService.getCurrentUser() !== null,

  login: async (emailOrPhone, password) => {
    if (isSupabaseConfigured()) {
      // Real Supabase email auth
      const cleanEmail = emailOrPhone.trim();
      const isEmail = cleanEmail.includes('@');
      let authResult;
      try {
        authResult = await supabase.auth.signInWithPassword({
          email: isEmail ? cleanEmail.toLowerCase() : cleanEmail,
          password: password || '',
        });
      } catch (networkErr: any) {
        throw new Error(
          networkErr?.message ||
          'Network request failed. Please check your internet connection or use Field Mode.'
        );
      }

      if (authResult?.error) {
        throw new Error(authResult.error.message);
      }

      const sbUser = authResult?.data?.user;
      if (!sbUser) throw new Error('Authentication failed');

      // Fetch profile from supabase profiles table if it exists
      let profile: any = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .single();
        profile = data;
      } catch {
        // Fall back gracefully to metadata if table is not yet migrated
      }

      const user: User = {
        id: sbUser.id,
        fullName: profile?.full_name || sbUser.user_metadata?.full_name || sbUser.email || 'User',
        email: sbUser.email || cleanEmail,
        phone: profile?.phone || sbUser.phone || undefined,
        createdAt: sbUser.created_at,
      };

      dbService.setCurrentUser(user);
      set({ currentUser: user, isAuthenticated: true, isOffline: false });

      // Fetch their test history from Supabase in background
      try {
        await get().loadUserSources();
      } catch {}
      return true;
    } else {
      // Local-only mode when Supabase is not configured
      return get().loginOffline(emailOrPhone);
    }
  },

  loginOffline: async (name?: string) => {
    const displayName = (name && name.trim()) || 'SafeSip Field User';
    const cleanEmail = displayName.includes('@')
      ? displayName
      : `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'field'}@safesip.local`;

    const user: User = {
      id: `local-${Date.now()}`,
      fullName: displayName.includes('@') ? displayName.split('@')[0] : displayName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };
    dbService.setCurrentUser(user);
    dbService.setOfflineMode(true);
    set({ currentUser: user, isAuthenticated: true, isOffline: true });
    return true;
  },

  signUp: async (fullName, email, phone, password) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || '',
        options: {
          data: { full_name: fullName, phone },
        },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Sign-up failed. Please try again.');

      // Upsert profile record
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        created_at: new Date().toISOString(),
      });

      const user: User = {
        id: data.user.id,
        fullName,
        email,
        phone,
        createdAt: new Date().toISOString(),
      };
      dbService.setCurrentUser(user);
      set({ currentUser: user, isAuthenticated: true });
      return true;
    } else {
      // Local-only sign-up
      const user: User = {
        id: `local-${Date.now()}`,
        fullName,
        email,
        phone,
        createdAt: new Date().toISOString(),
      };
      dbService.setCurrentUser(user);
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
  },

  logout: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    dbService.setCurrentUser(null);
    set({
      currentUser: null,
      isAuthenticated: false,
      tests: [],
      sources: [],
      connectedDevice: null,
      bleState: 'disconnected',
      lastCompletedTest: null,
    });
  },

  // Bluetooth — start disconnected; no fake pre-connected devices
  connectedDevice: bleService.getConnectedDevice(),
  discoveredDevices: [],
  bleState: bleService.getConnectionState(),

  startBleScan: async () => {
    // bleService manages its own state (permission_denied, bluetooth_off, etc.)
    // subscribe to propagate state changes back to the store
    const unsub = bleService.onConnectionStateChange(state => {
      set({ bleState: state });
    });

    await bleService.startScan(devices => {
      set({ discoveredDevices: devices });
    });

    unsub(); // remove listener after scan completes
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
    } catch (err: any) {
      set({ bleState: 'disconnected' });
      throw err;
    }
  },

  connectSimulatedDevice: () => {
    const simDevice: Device = {
      id: 'sim-safesip-bottle-01',
      name: 'SafeSip Smart Bottle (Simulator)',
      macAddress: 'C8:F0:9E:A1:B2:C3',
      rssi: -45,
      batteryLevel: 94,
      isConnected: true,
      firmwareVersion: 'ESP32 v2.4 (Sim)',
    };
    set({
      connectedDevice: simDevice,
      bleState: 'connected',
      discoveredDevices: [
        simDevice,
        ...get().discoveredDevices.filter(d => d.id !== simDevice.id),
      ],
    });
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
      async finalReading => {
        const user = get().currentUser;
        const device = get().connectedDevice;

        let testLat = 37.7749;
        let testLng = -122.4194;
        try {
          const globalNav = (globalThis as any)?.navigator;
          if (globalNav?.geolocation) {
            globalNav.geolocation.getCurrentPosition(
              (pos: any) => {
                if (pos?.coords) {
                  testLat = pos.coords.latitude;
                  testLng = pos.coords.longitude;
                }
              },
              () => {},
              { timeout: 3000 }
            );
          }
        } catch {}

        const newTest: WaterTest = {
          id: `test-${Date.now()}`,
          deviceId: device?.id || 'HC-05-Sensor',
          userId: user?.id || 'anonymous',
          sourceName: 'SafeSip Field Sample',
          locationName: 'Current Location',
          latitude: testLat,
          longitude: testLng,
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

        // Push to Supabase if configured and online (instantly broadcasts to all users via Realtime)
        if (isSupabaseConfigured() && !get().isOffline) {
          try {
            await supabase.from('water_tests').insert([{
              id: newTest.id,
              device_id: newTest.deviceId,
              user_id: newTest.userId,
              latitude: newTest.latitude,
              longitude: newTest.longitude,
              location_name: newTest.locationName,
              ph: newTest.pH,
              tds: newTest.tds,
              conductivity: newTest.conductivity,
              turbidity: newTest.turbidity,
              temperature: newTest.temperature,
              safety_status: newTest.safetyStatus,
              measured_at: newTest.timestamp,
            }]);

            // Register/update as community water source so all connected users see the new point on heatmap
            await supabase.from('water_sources').insert([{
              name: newTest.sourceName || 'Field Water Point',
              location_name: newTest.locationName || 'Sample Location',
              latitude: newTest.latitude,
              longitude: newTest.longitude,
              safety_status: newTest.safetyStatus,
              latest_ph: newTest.pH,
              latest_tds: newTest.tds,
              latest_conductivity: newTest.conductivity,
              latest_turbidity: newTest.turbidity,
              latest_temperature: newTest.temperature,
              last_tested_at: newTest.timestamp,
              test_count: 1,
            }]);
          } catch {
            newTest.syncStatus = 'pending';
          }
        }

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

  loadUserSources: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('water_sources')
        .select('*')
        .order('last_tested_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: WaterSource[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          locationName: row.location_name,
          latitude: row.latitude,
          longitude: row.longitude,
          safetyStatus: row.safety_status,
          latestPh: row.latest_ph,
          latestTds: row.latest_tds,
          latestConductivity: row.latest_conductivity,
          latestTurbidity: row.latest_turbidity,
          latestTemperature: row.latest_temperature,
          lastTestedAt: row.last_tested_at,
          testCount: row.test_count || 0,
          description: row.description,
        }));
        set({ sources: mapped });
        return;
      }
    }
    // Fallback: use local db sources (community data from BLE tests)
    set({ sources: dbService.getAllSources() });
  },

  subscribeToRealtimeSources: () => {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const channel = supabase
      .channel('public:community_sources_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'water_sources' },
        () => {
          // Instantly sync community heatmap data across all devices
          get().loadUserSources();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_tests' },
        () => {
          get().loadUserSources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

