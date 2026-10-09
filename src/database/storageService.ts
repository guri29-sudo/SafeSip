import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterTest, WaterSource, SyncQueueItem, User } from '../types';

/**
 * Offline-first persistent storage engine.
 * All data is saved to AsyncStorage so it survives app restarts.
 * In-memory cache is used for synchronous reads after initial load.
 */

const STORAGE_KEYS = {
  TESTS: '@safesip/tests',
  SOURCES: '@safesip/sources',
  SYNC_QUEUE: '@safesip/sync_queue',
  CURRENT_USER: '@safesip/current_user',
  IS_OFFLINE: '@safesip/is_offline',
};

class SafeSipDatabaseService {
  private tests: WaterTest[] = [];
  private sources: WaterSource[] = [];
  private syncQueue: SyncQueueItem[] = [];
  private currentUser: User | null = null;
  private isOffline: boolean = false;
  private loaded: boolean = false;

  // ─── Boot: load all persisted data from AsyncStorage ─────────────────────
  public async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const [testsRaw, sourcesRaw, queueRaw, userRaw, offlineRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TESTS),
        AsyncStorage.getItem(STORAGE_KEYS.SOURCES),
        AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.IS_OFFLINE),
      ]);

      this.tests = testsRaw ? JSON.parse(testsRaw) : [];
      this.sources = sourcesRaw ? JSON.parse(sourcesRaw) : [];
      this.syncQueue = queueRaw ? JSON.parse(queueRaw) : [];
      this.currentUser = userRaw ? JSON.parse(userRaw) : null;
      this.isOffline = offlineRaw === 'true';
      this.loaded = true;
    } catch (err) {
      console.warn('[SafeSip DB] Failed to load persisted data:', err);
      this.loaded = true;
    }
  }

  private async persistTests() {
    try { await AsyncStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(this.tests)); } catch {}
  }
  private async persistSources() {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(this.sources)); } catch {}
  }
  private async persistSyncQueue() {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue)); } catch {}
  }

  // ─── Tests CRUD ───────────────────────────────────────────────────────────

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
        this.persistSources();
      }
    }
    this.persistTests();
    return test;
  }

  // ─── Water Sources ────────────────────────────────────────────────────────

  public getAllSources(): WaterSource[] {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
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

  public setSources(sources: WaterSource[]) {
    this.sources = sources;
    this.persistSources();
  }

  // ─── Sync Queue & Offline Mode ────────────────────────────────────────────

  public setOfflineMode(offline: boolean) {
    this.isOffline = offline;
    AsyncStorage.setItem(STORAGE_KEYS.IS_OFFLINE, String(offline)).catch(() => {});
  }

  public getIsOffline(): boolean {
    return this.isOffline;
  }

  public getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  public addToSyncQueue(item: SyncQueueItem) {
    this.syncQueue.push(item);
    this.persistSyncQueue();
  }

  public clearSyncedItem(id: string) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    this.persistSyncQueue();
  }

  public markAllAsSynced() {
    this.tests = this.tests.map(t => ({ ...t, syncStatus: 'synced' }));
    this.syncQueue = [];
    this.persistTests();
    this.persistSyncQueue();
  }

  // ─── User Profile ─────────────────────────────────────────────────────────

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async setCurrentUser(user: User | null): Promise<void> {
    this.currentUser = user;
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch {}
  }

  // Synchronous version for store init (uses in-memory after load())
  public setCurrentUserSync(user: User | null) {
    this.currentUser = user;
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch(() => {});
    }
  }
}

export const dbService = new SafeSipDatabaseService();
