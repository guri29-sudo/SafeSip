import { WaterTest, WaterSource, SyncQueueItem, User } from '../types';

/**
 * Offline-first persistent storage engine.
 * In-memory cache backed by AsyncStorage / SQLite (wire up in production).
 * No fake seeded data — starts empty; data flows in from BLE tests and Supabase sync.
 */
class SafeSipDatabaseService {
  private tests: WaterTest[] = [];
  private sources: WaterSource[] = [];
  private syncQueue: SyncQueueItem[] = [];
  private currentUser: User | null = null;
  private isOffline: boolean = false;

  constructor() {
    // No seed data — the app starts in a real empty state.
    // currentUser is null until the user logs in via Supabase Auth.
    // sources and tests are populated from BLE readings and Supabase sync.
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
