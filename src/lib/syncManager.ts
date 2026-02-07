// US-025: Client-side sync manager
// Handles periodic sync, offline queue, and conflict resolution

export interface SyncManagerConfig {
  syncInterval: number; // milliseconds (default: 5000 = 5 seconds)
  maxRetries: number;
  userId: string;
  onSyncComplete?: (result: SyncResult) => void;
  onConflict?: (conflict: ConflictInfo) => void;
  onError?: (error: Error) => void;
}

export interface SyncResult {
  success: boolean;
  syncedPets: number;
  conflicts: number;
  errors: string[];
}

export interface ConflictInfo {
  petId: string;
  entityType: string;
  reason: string;
  serverTime: string;
}

export interface OfflineAction {
  petId?: string;
  actionType: string;
  actionData: any;
  timestamp: number;
}

/**
 * Client-side sync manager for cross-platform synchronization
 */
export class SyncManager {
  private config: SyncManagerConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private offlineQueue: OfflineAction[] = [];
  private lastSyncTime: Date = new Date();
  private isOnline = true;

  constructor(config: SyncManagerConfig) {
    this.config = config;

    // Load offline queue from localStorage
    this.loadOfflineQueue();

    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Start periodic syncing
   */
  start(): void {
    if (this.syncTimer) {
      console.warn('SyncManager already started');
      return;
    }

    console.log('🔄 SyncManager started');
    this.syncTimer = setInterval(() => {
      this.sync();
    }, this.config.syncInterval);

    // Sync immediately on start
    this.sync();
  }

  /**
   * Stop periodic syncing
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏸️ SyncManager stopped');
    }
  }

  /**
   * Perform sync operation
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing || !this.isOnline) {
      return {
        success: false,
        syncedPets: 0,
        conflicts: 0,
        errors: ['Sync already in progress or offline'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedPets: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Process offline queue first
      await this.processOfflineQueue();

      // Get sync status
      const statusResponse = await fetch('/api/sync/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to get sync status');
      }

      const statusData = await statusResponse.json();
      const { recentSyncs } = statusData.data;

      // Group syncs by petId
      const petIds = new Set(
        recentSyncs.filter((s: any) => s.petId).map((s: any) => s.petId)
      );

      // Sync each pet
      for (const petId of petIds) {
        try {
          const syncResponse = await fetch(
            `/api/sync/pet/${petId}?since=${this.lastSyncTime.toISOString()}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              },
            }
          );

          if (syncResponse.ok) {
            result.syncedPets++;
          } else {
            result.errors.push(`Failed to sync pet ${petId}`);
          }
        } catch (error) {
          result.errors.push(`Error syncing pet ${petId}: ${error}`);
        }
      }

      this.lastSyncTime = new Date();

      if (this.config.onSyncComplete) {
        this.config.onSyncComplete(result);
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync error: ${error}`);

      if (this.config.onError && error instanceof Error) {
        this.config.onError(error);
      }
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Queue an action for offline sync
   */
  queueAction(action: OfflineAction): void {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
    });

    this.saveOfflineQueue();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.processOfflineQueue();
    }
  }

  /**
   * Process queued offline actions
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const action of queue) {
      try {
        const response = await fetch('/api/sync/offline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            petId: action.petId,
            actionType: action.actionType,
            actionData: action.actionData,
            platform: 'web',
          }),
        });

        if (!response.ok) {
          // Re-queue failed action
          this.offlineQueue.push(action);
        }
      } catch (error) {
        // Re-queue on error
        this.offlineQueue.push(action);
        console.error('Failed to sync offline action:', error);
      }
    }

    this.saveOfflineQueue();
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('offlineQueue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('📡 Back online - syncing...');
    this.isOnline = true;
    this.sync();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('📴 Offline mode - actions will be queued');
    this.isOnline = false;
  }

  /**
   * Get current sync status
   */
  getStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queuedActions: number;
    lastSyncTime: Date;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedActions: this.offlineQueue.length,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

/**
 * Create a singleton sync manager instance
 */
let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(config?: SyncManagerConfig): SyncManager | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!syncManagerInstance && config) {
    syncManagerInstance = new SyncManager(config);
  }

  return syncManagerInstance;
}

export function destroySyncManager(): void {
  if (syncManagerInstance) {
    syncManagerInstance.stop();
    syncManagerInstance = null;
  }
}
