import { dbService } from '../database/storageService';
import { supabase } from './supabaseClient';
import { WaterTest } from '../types';

export class SyncWorker {
  private isSyncing: boolean = false;

  public async syncPendingQueue(): Promise<{ syncedCount: number; errors: number }> {
    if (this.isSyncing) {
      return { syncedCount: 0, errors: 0 };
    }

    if (dbService.getIsOffline()) {
      return { syncedCount: 0, errors: 0 };
    }

    this.isSyncing = true;
    const queue = dbService.getSyncQueue();
    let syncedCount = 0;
    let errors = 0;

    for (const item of queue) {
      try {
        if (item.action === 'CREATE_TEST') {
          const test: WaterTest = item.payload;

          // Attempt insertion into Supabase table: water_tests
          const { error } = await supabase.from('water_tests').insert([
            {
              id: test.id,
              device_id: test.deviceId,
              user_id: test.userId,
              source_id: test.sourceId,
              latitude: test.latitude,
              longitude: test.longitude,
              location_name: test.locationName,
              ph: test.pH,
              tds: test.tds,
              conductivity: test.conductivity,
              turbidity: test.turbidity,
              temperature: test.temperature,
              safety_status: test.safetyStatus,
              measured_at: test.timestamp,
            },
          ]);

          if (error && error.code !== 'PGRST116') {
            // Real network or server error
            item.retryCount += 1;
            item.lastError = error.message;
            errors++;
          } else {
            // Successfully uploaded or mock simulated
            dbService.clearSyncedItem(item.id);
            syncedCount++;
          }
        }
      } catch (e: any) {
        errors++;
        item.retryCount += 1;
        item.lastError = e?.message || 'Sync connection timeout';
      }
    }

    if (syncedCount > 0 && errors === 0) {
      dbService.markAllAsSynced();
    }

    this.isSyncing = false;
    return { syncedCount, errors };
  }
}

export const syncWorker = new SyncWorker();
