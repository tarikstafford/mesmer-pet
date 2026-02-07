'use client';

// US-025: Sync status indicator component
import { useEffect, useState } from 'react';
import { getSyncManager, type SyncResult } from '@/lib/syncManager';

interface SyncStatusProps {
  userId: string;
}

export default function SyncStatus({ userId }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean;
    isSyncing: boolean;
    queuedActions: number;
    lastSyncTime: Date | null;
  }>({
    isOnline: true,
    isSyncing: false,
    queuedActions: 0,
    lastSyncTime: null,
  });

  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initialize sync manager
    const syncManager = getSyncManager({
      syncInterval: 5000, // Sync every 5 seconds
      maxRetries: 3,
      userId,
      onSyncComplete: (result) => {
        setLastSyncResult(result);
      },
      onError: (error) => {
        console.error('Sync error:', error);
      },
    });

    if (!syncManager) {
      return;
    }

    // Start syncing
    syncManager.start();

    // Update status periodically
    const statusInterval = setInterval(() => {
      const status = syncManager.getStatus();
      setSyncStatus({
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        queuedActions: status.queuedActions,
        lastSyncTime: status.lastSyncTime,
      });
    }, 1000);

    return () => {
      syncManager.stop();
      clearInterval(statusInterval);
    };
  }, [userId]);

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return '📴';
    }
    if (syncStatus.isSyncing) {
      return '🔄';
    }
    if (syncStatus.queuedActions > 0) {
      return '⏳';
    }
    return '✅';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    if (syncStatus.queuedActions > 0) {
      return `${syncStatus.queuedActions} queued`;
    }
    return 'Synced';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) {
      return 'Never';
    }

    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 10) {
      return 'Just now';
    }
    if (seconds < 60) {
      return `${seconds}s ago`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 cursor-pointer hover:bg-white transition-all"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xl animate-pulse">{getStatusIcon()}</span>
          <div className="text-sm">
            <div className="font-medium text-gray-900">{getStatusText()}</div>
            <div className="text-xs text-gray-500">{formatLastSync()}</div>
          </div>
        </div>

        {showDetails && (
          <div className="border-t border-gray-200 px-4 py-3 space-y-2">
            <div className="text-xs">
              <div className="font-medium text-gray-700 mb-1">Sync Details</div>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium">
                    {syncStatus.isOnline ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>
                {lastSyncResult && (
                  <>
                    <div className="flex justify-between">
                      <span>Last sync:</span>
                      <span className="font-medium">
                        {lastSyncResult.success ? '✅' : '❌'}{' '}
                        {lastSyncResult.syncedPets} pets
                      </span>
                    </div>
                    {lastSyncResult.conflicts > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span>Conflicts:</span>
                        <span className="font-medium">{lastSyncResult.conflicts}</span>
                      </div>
                    )}
                    {lastSyncResult.errors.length > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Errors:</span>
                        <span className="font-medium">{lastSyncResult.errors.length}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {syncStatus.queuedActions > 0 && (
              <div className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                <div className="font-medium text-yellow-800">
                  {syncStatus.queuedActions} action(s) queued
                </div>
                <div className="text-yellow-600">
                  Will sync when connection is restored
                </div>
              </div>
            )}

            {lastSyncResult?.errors && lastSyncResult.errors.length > 0 && (
              <div className="text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                <div className="font-medium text-red-800">Recent Errors:</div>
                <div className="text-red-600 space-y-1 mt-1">
                  {lastSyncResult.errors.slice(0, 3).map((error, i) => (
                    <div key={i} className="truncate">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
