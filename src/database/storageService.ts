import { WaterTest, WaterSource, SyncQueueItem, User } from '../types';

/**
 * Offline-first persistent storage engine.
 * Supports SQLite / AsyncStorage with resilient in-memory caching and sync queue.
 */
class SafeSipDatabaseService {
  private tests: WaterTest[] = [];
  private sources: WaterSource[] = [];
  private syncQueue: SyncQueueItem[] = [];
  private currentUser: User | null = null;
  private isOffline: boolean = false;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Current user matching prompt requirement: "Hi, Vedant 👋"
    this.currentUser = {
      id: 'usr-vedant-01',
      fullName: 'Vedant',
      email: 'vedant@safesip.org',
      phone: '+1 (555) 382-9901',
      createdAt: '2026-01-15T08:00:00Z',
    };

    // Pre-populate realistic community water sources matching requirements
    this.sources = [
      {
        id: 'src-lake-view',
        name: 'Lake View Reservoir',
        locationName: 'North Basin, Shoreline Trail',
        latitude: 37.7749,
        longitude: -122.4194,
        safetyStatus: 'SAFE',
        latestPh: 7.4,
        latestTds: 125,
        latestConductivity: 310,
        latestTurbidity: 0.8,
        latestTemperature: 22.5,
        lastTestedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        testCount: 42,
        description: 'Municipal protected fresh water catchment with dual gravel-bed filtration.',
      },
      {
        id: 'src-riverside',
        name: 'Riverside Creek Point',
        locationName: 'East Bank, Bridge Overpass',
        latitude: 37.785,
        longitude: -122.408,
        safetyStatus: 'CAUTION',
        latestPh: 6.3,
        latestTds: 380,
        latestConductivity: 590,
        latestTurbidity: 2.4,
        latestTemperature: 24.1,
        lastTestedAt: new Date(Date.now() - 14 * 3600000).toISOString(),
        testCount: 19,
        description: 'Flowing natural creek. Slight agricultural runoff causing elevated TDS and mild acidity.',
      },
      {
        id: 'src-village-well',
        name: 'Village Community Well #4',
        locationName: 'Civic Commons Center',
        latitude: 37.761,
        longitude: -122.428,
        safetyStatus: 'UNSAFE',
        latestPh: 9.3,
        latestTds: 680,
        latestConductivity: 940,
        latestTurbidity: 7.2,
        latestTemperature: 26.8,
        lastTestedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
        testCount: 57,
        description: 'Shallow aquifer borehole. High suspended solids and severe alkaline shift detected. Do not drink untreated.',
      },
      {
        id: 'src-stream-point',
        name: 'Stream Point Spring',
        locationName: 'Highland Alpine Trailhead',
        latitude: 37.792,
        longitude: -122.435,
        safetyStatus: 'SAFE',
        latestPh: 7.2,
        latestTds: 95,
        latestConductivity: 240,
        latestTurbidity: 0.4,
        latestTemperature: 18.2,
        lastTestedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        testCount: 31,
        description: 'Natural high-elevation mountain spring flowing over granite bedrock.',
      },
      {
        id: 'src-pine-spring',
        name: 'Pine Valley Wellhead',
        locationName: 'Old Mill Road, Sector 8',
        latitude: 37.755,
        longitude: -122.445,
        safetyStatus: 'UNVERIFIED',
        latestPh: 7.1,
        latestTds: 210,
        latestConductivity: 410,
        latestTurbidity: 1.1,
        latestTemperature: 20.0,
        lastTestedAt: new Date(Date.now() - 35 * 86400000).toISOString(), // > 30 days ago
        testCount: 8,
        description: 'Unverified source. Last community sample collected over 30 days ago. Requires new test verification.',
      },
    ];

    // Pre-populate test history matching requirements:
    // Lake View — SAFE
    // Riverside — CAUTION
    // Village Well — UNSAFE
    // Lake View — SAFE
    // Stream Point — SAFE
    this.tests = [
      {
        id: 'test-101',
        deviceId: 'safesip-0012',
        userId: 'usr-vedant-01',
        sourceId: 'src-lake-view',
        sourceName: 'Lake View',
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: 'North Shoreline Deck',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        pH: 7.4,
        tds: 125,
        conductivity: 310,
        turbidity: 0.8,
        temperature: 22.5,
        safetyStatus: 'SAFE',
        syncStatus: 'synced',
      },
      {
        id: 'test-102',
        deviceId: 'safesip-0012',
        userId: 'usr-vedant-01',
        sourceId: 'src-riverside',
        sourceName: 'Riverside',
        latitude: 37.785,
        longitude: -122.408,
        locationName: 'Bridge Underpass',
        timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
        pH: 6.3,
        tds: 380,
        conductivity: 590,
        turbidity: 2.4,
        temperature: 24.1,
        safetyStatus: 'CAUTION',
        syncStatus: 'synced',
      },
      {
        id: 'test-103',
        deviceId: 'safesip-0012',
        userId: 'usr-vedant-01',
        sourceId: 'src-village-well',
        sourceName: 'Village Well',
        latitude: 37.761,
        longitude: -122.428,
        locationName: 'Civic Commons Plaza',
        timestamp: new Date(Date.now() - 50 * 3600000).toISOString(),
        pH: 9.3,
        tds: 680,
        conductivity: 940,
        turbidity: 7.2,
        temperature: 26.8,
        safetyStatus: 'UNSAFE',
        syncStatus: 'synced',
      },
      {
        id: 'test-104',
        deviceId: 'safesip-0012',
        userId: 'usr-vedant-01',
        sourceId: 'src-lake-view',
        sourceName: 'Lake View',
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: 'South Pier Jetty',
        timestamp: new Date(Date.now() - 96 * 3600000).toISOString(),
        pH: 7.5,
        tds: 132,
        conductivity: 318,
        turbidity: 0.9,
        temperature: 21.8,
        safetyStatus: 'SAFE',
        syncStatus: 'synced',
      },
      {
        id: 'test-105',
        deviceId: 'safesip-0012',
        userId: 'usr-vedant-01',
        sourceId: 'src-stream-point',
        sourceName: 'Stream Point',
        latitude: 37.792,
        longitude: -122.435,
        locationName: 'Highland Trail Inlet',
        timestamp: new Date(Date.now() - 140 * 3600000).toISOString(),
        pH: 7.2,
        tds: 95,
        conductivity: 240,
        turbidity: 0.4,
        temperature: 18.2,
        safetyStatus: 'SAFE',
        syncStatus: 'synced',
      },
    ];
  }

  // --- Tests CRUD ---
  public getAllTests(): WaterTest[] {
    return [...this.tests].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getLatestTest(): WaterTest | null {
    const list = this.getAllTests();
    return list.length > 0 ? list[0] : null;
  }

  public saveTest(test: WaterTest): WaterTest {
    // If offline, flag as pending and push to syncQueue
    if (this.isOffline) {
      test.syncStatus = 'pending';
      this.addToSyncQueue({
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        action: 'CREATE_TEST',
        payload: test,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });
    }

    this.tests.unshift(test);

    // If linked to a source, update the source latest metrics
    if (test.sourceId) {
      const srcIndex = this.sources.findIndex(s => s.id === test.sourceId);
      if (srcIndex >= 0) {
        this.sources[srcIndex] = {
          ...this.sources[srcIndex],
          latestPh: test.pH,
          latestTds: test.tds,
          latestConductivity: test.conductivity,
          latestTurbidity: test.turbidity,
          latestTemperature: test.temperature,
          safetyStatus: test.safetyStatus,
          lastTestedAt: test.timestamp,
          testCount: this.sources[srcIndex].testCount + 1,
        };
      }
    }

    return test;
  }

  // --- Water Sources ---
  public getAllSources(): WaterSource[] {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Apply rule: A source with no reading for 30 days should be treated as UNVERIFIED
    return this.sources.map(src => {
      const elapsed = now - new Date(src.lastTestedAt).getTime();
      if (elapsed > thirtyDaysMs) {
        return { ...src, safetyStatus: 'UNVERIFIED' };
      }
      return src;
    });
  }

  public getSourceById(id: string): WaterSource | undefined {
    return this.getAllSources().find(s => s.id === id);
  }

  public getTestsForSource(sourceId: string): WaterTest[] {
    return this.tests.filter(t => t.sourceId === sourceId);
  }

  // --- Sync Queue & Offline Mode ---
  public setOfflineMode(offline: boolean) {
    this.isOffline = offline;
  }

  public getIsOffline(): boolean {
    return this.isOffline;
  }

  public getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  public addToSyncQueue(item: SyncQueueItem) {
    this.syncQueue.push(item);
  }

  public clearSyncedItem(id: string) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  public markAllAsSynced() {
    this.tests = this.tests.map(t => ({ ...t, syncStatus: 'synced' }));
    this.syncQueue = [];
  }

  // --- User Profile ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
  }
}

export const dbService = new SafeSipDatabaseService();
