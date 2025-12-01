import { create } from 'zustand';
import type { SyncState } from '@/services/storage/syncService';

interface SyncStore extends SyncState {
  updateState: (state: Partial<SyncState>) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  // Initial state
  isSyncing: false,
  isOnline: true,
  queueSize: 0,
  lastSync: null,
  errors: [],

  // Actions
  updateState: (state) => set((prev) => ({ ...prev, ...state })),
}));