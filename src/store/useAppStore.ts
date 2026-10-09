import { create } from 'zustand';
import {
  User,
  Device,
  WaterTest,
  WaterSource,
  SensorReading,
  SyncQueueItem,
} from '../types';
import { dbService, RegisteredAccount } from '../database/storageService';
import { bleService, BleConnectionState } from '../bluetooth/BleService';
import { syncWorker } from '../api/syncWorker';
import { supabase, isSupabaseConfigured } from '../api/supabaseClient';

interface AppState {
  // --- App Boot ---
  isBootReady: boolean;
  bootApp: () => Promise<void>;

  // --- Auth ---
  currentUser: User | null;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  signUp: (fullName: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  setGuestMode: (guest: boolean) => void;

  // --- Bluetooth Hardware ---
  connectedDevice: Device | null;
  discoveredDevices: Device[];
  bleState: BleConnectionState;
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
  // ─── Boot ────────────────────────────────────────────────────────────────
  isBootReady: false,

  bootApp: async () => {
    // 1. Load all persisted data from AsyncStorage
    await dbService.load();

    // 2. Check local database for persisted user session
    let restoredUser: User | null = dbService.getCurrentUser();
    let isAuthenticated = !!restoredUser;

    // 3. If Supabase is configured and has an active session, refresh profile
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const sbUser = session.user;
          let profile: any = null;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sbUser.id)
              .single();
            profile = data;
          } catch {}

          restoredUser = {
            id: sbUser.id,
            fullName: profile?.full_name || sbUser.user_metadata?.full_name || restoredUser?.fullName || 'User',
            email: sbUser.email || restoredUser?.email || '',
            phone: profile?.phone || sbUser.phone || restoredUser?.phone,
            createdAt: sbUser.created_at || restoredUser?.createdAt || new Date().toISOString(),
          };
          isAuthenticated = true;
          await dbService.setCurrentUser(restoredUser);
        }
      } catch {}
    }

    set({
      isBootReady: true,
      currentUser: restoredUser,
      isAuthenticated,
      isGuestMode: false,
      tests: dbService.getAllTests(),
      sources: dbService.getAllSources(),
      syncQueue: dbService.getSyncQueue(),
      isOffline: dbService.getIsOffline(),
    });

    // Load remote sources in background
    if (isAuthenticated) {
      get().loadUserSources().catch(() => {});
    }
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────
  currentUser: null,
  isAuthenticated: false,
  isGuestMode: false,

  setGuestMode: (guest: boolean) => {
    set({ isGuestMode: guest });
  },

  login: async (emailOrPhone, password) => {
    await dbService.load();
    const cleanInput = emailOrPhone.trim();
    if (!cleanInput) {
      throw new Error('Please enter your registered email address or phone number.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }

    // 1. Check local registered accounts
    const localAccount = dbService.findAccountByEmailOrPhone(cleanInput);
    if (localAccount) {
      if (localAccount.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      const user: User = {
        id: localAccount.id,
        fullName: localAccount.fullName,
        email: localAccount.email,
        phone: localAccount.phone,
        createdAt: localAccount.createdAt,
      };

      // Sync Supabase session in background if online
      if (isSupabaseConfigured() && !get().isOffline) {
        supabase.auth.signInWithPassword({
          email: localAccount.email,
          password,
        }).catch(() => {});
      }

      await dbService.setCurrentUser(user);
      set({ currentUser: user, isAuthenticated: true, isGuestMode: false, isOffline: false });
      try { await get().loadUserSources(); } catch {}
      return true;
    }

    // 2. If not found locally, check Supabase cloud (for cross-device logins)
    if (isSupabaseConfigured() && !get().isOffline) {
      const isEmail = cleanInput.includes('@');
      if (isEmail) {
        let authResult;
        try {
          authResult = await supabase.auth.signInWithPassword({
            email: cleanInput.toLowerCase(),
            password,
          });
        } catch (networkErr: any) {
          throw new Error(
            networkErr?.message || 'Network error. Please check your internet connection.'
          );
        }

        if (authResult?.error) {
          if (
            authResult.error.message.toLowerCase().includes('invalid login credentials') ||
            authResult.error.status === 400
          ) {
            throw new Error('Invalid email or password. If you have not registered yet, please Sign Up first.');
          }
          throw new Error(authResult.error.message);
        }

        const sbUser = authResult?.data?.user;
        if (!sbUser) {
          throw new Error('Authentication failed. Please verify your credentials or register.');
        }

        let profile: any = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .single();
          profile = data;
        } catch {}

        const user: User = {
          id: sbUser.id,
          fullName: profile?.full_name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
          email: sbUser.email || cleanInput.toLowerCase(),
          phone: profile?.phone || sbUser.phone || undefined,
          createdAt: sbUser.created_at,
        };

        // Cache into local registered accounts
        await dbService.saveRegisteredAccount({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || '',
          password,
          createdAt: user.createdAt,
        });

        await dbService.setCurrentUser(user);
        set({ currentUser: user, isAuthenticated: true, isGuestMode: false, isOffline: false });
        try { await get().loadUserSources(); } catch {}
        return true;
      }
    }

    // 3. Not registered anywhere
    throw new Error(`No registered account found for "${cleanInput}". Please register first.`);
  },

  signUp: async (fullName, email, phone, password) => {
    await dbService.load();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !password) {
      throw new Error('All registration fields are required.');
    }

    // Check if account already registered
    const existing = dbService.findAccountByEmailOrPhone(cleanEmail) || dbService.findAccountByEmailOrPhone(cleanPhone);
    if (existing) {
      throw new Error('An account with this email or phone is already registered. Please log in.');
    }

    let userId = `user-${Date.now()}`;

    // Register with Supabase if online
    if (isSupabaseConfigured() && !get().isOffline) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: cleanName, phone: cleanPhone },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            throw new Error('An account with this email is already registered. Please log in.');
          }
          console.warn('[Supabase SignUp]', error.message);
        } else if (data?.user?.id) {
          userId = data.user.id;
          try {
            await supabase.from('profiles').upsert({
              id: userId,
              full_name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              created_at: new Date().toISOString(),
            });
          } catch {}
        }
      } catch (sbErr: any) {
        if (sbErr.message?.includes('already registered')) {
          throw sbErr;
        }
        console.warn('[Supabase SignUp Error]', sbErr);
      }
    }

    // Save registered account permanently in local DB
    const newAccount: RegisteredAccount = {
      id: userId,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      createdAt: new Date().toISOString(),
    };
    await dbService.saveRegisteredAccount(newAccount);

    const user: User = {
      id: userId,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      createdAt: newAccount.createdAt,
    };
    await dbService.setCurrentUser(user);
    set({ currentUser: user, isAuthenticated: true, isGuestMode: false });
    return true;
  },

  forgotPassword: async (email: string) => {
    if (!email.trim() || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!isSupabaseConfigured()) {
      throw new Error('Password reset requires internet. Please try again online.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: 'safesip://reset-password',
    });
    if (error) throw new Error(error.message);
  },

  logout: async () => {
    if (isSupabaseConfigured()) {
      try { await supabase.auth.signOut(); } catch {}
    }
    dbService.setCurrentUserSync(null);
    set({
      currentUser: null,
      isAuthenticated: false,
      isGuestMode: false,
      tests: [],
      sources: [],
      syncQueue: [],
      connectedDevice: null,
      bleState: 'disconnected',
      lastCompletedTest: null,
    });
  },

  // ─── Bluetooth ─────────────────────────────────────────────────────────────
  connectedDevice: null,
  discoveredDevices: [],
  bleState: 'disconnected',

  startBleScan: async () => {
    // Block BT scan in guest mode
    if (get().isGuestMode) return;

    const unsub = bleService.onConnectionStateChange(state => {
      set({ bleState: state });
    });
    await bleService.startScan(devices => {
      set({ discoveredDevices: devices });
    });
    unsub();
  },

  connectBleDevice: async (deviceId: string) => {
    if (get().isGuestMode) return;
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
    if (get().isGuestMode) return;
    const simDevice: Device = {
      id: 'sim-arduino-nano-01',
      name: 'SafeSip Arduino Nano (Simulator)',
      macAddress: 'C8:F0:9E:A1:B2:C3',
      rssi: -45,
      batteryLevel: 0,
      isConnected: true,
      firmwareVersion: 'Arduino Nano v3 (Sim)',
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

  // ─── Live Testing ──────────────────────────────────────────────────────────
  isTesting: false,
  testProgress: 0,
  testStage: 'Ready to test',
  liveReading: defaultSensorReading,
  activeTestError: null,
  lastCompletedTest: null,

  startLiveTest: onCompleteNavigate => {
    // Block testing in guest mode
    if (get().isGuestMode) {
      set({ activeTestError: 'Guest mode: Please create an account to run water tests.' });
      return;
    }

    set({
      isTesting: true,
      testProgress: 0,
      testStage: 'Initializing Arduino Nano sensors…',
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

        let testLat = 20.5937; // India center fallback
        let testLng = 78.9629;
        try {
          const globalNav = (globalThis as any)?.navigator;
          if (globalNav?.geolocation) {
            await new Promise<void>(resolve => {
              globalNav.geolocation.getCurrentPosition(
                (pos: any) => {
                  if (pos?.coords) {
                    testLat = pos.coords.latitude;
                    testLng = pos.coords.longitude;
                  }
                  resolve();
                },
                () => resolve(),
                { timeout: 4000, enableHighAccuracy: true }
              );
            });
          }
        } catch {}

        const newTest: WaterTest = {
          id: `test-${Date.now()}`,
          deviceId: device?.id || 'Arduino-Nano-HC05',
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

        // Push to Supabase if configured and online
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

  // ─── Tests History ─────────────────────────────────────────────────────────
  tests: [],
  historyFilter: 'ALL',

  saveTestResult: (notes, sourceName) => {
    const last = get().lastCompletedTest;
    if (last) {
      if (notes) last.notes = notes;
      if (sourceName) last.sourceName = sourceName;
      set({ tests: dbService.getAllTests() });
      return last;
    }
    return dbService.getLatestTest()!;
  },

  setHistoryFilter: filter => {
    set({ historyFilter: filter });
  },

  // ─── Map & Sources ─────────────────────────────────────────────────────────
  sources: [],
  selectedSourceId: null,
  mapSearchQuery: '',
  mapStatusFilter: 'ALL',

  setSelectedSourceId: id => set({ selectedSourceId: id }),
  setMapSearchQuery: query => set({ mapSearchQuery: query }),
  setMapStatusFilter: filter => set({ mapStatusFilter: filter }),

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
        dbService.setSources(mapped);
        set({ sources: mapped });
        return;
      }
    }
    set({ sources: dbService.getAllSources() });
  },

  subscribeToRealtimeSources: () => {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel('public:community_sources_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_sources' }, () => {
        get().loadUserSources();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'water_tests' }, () => {
        get().loadUserSources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ─── Offline & Sync ────────────────────────────────────────────────────────
  isOffline: false,
  syncQueue: [],
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

  // ─── Navigation Tab ────────────────────────────────────────────────────────
  activeTab: 'home',
  setActiveTab: tab => set({ activeTab: tab }),
}));
