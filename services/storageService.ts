
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Provided credentials
const DEFAULT_URL = 'https://nizvotgebfvbptfkqlfi.supabase.co';
const DEFAULT_KEY = 'sb_publishable_5xoCICkhjoN-CxxfjVzP1Q_wdX_t12z';

const SUPABASE_URL = localStorage.getItem('ws_supabase_url') || DEFAULT_URL;
const SUPABASE_KEY = localStorage.getItem('ws_supabase_key') || DEFAULT_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

export const getCloudConfig = () => ({
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
  isActive: !!supabase
});

/**
 * Authentication Service
 */
export const auth = {
  signUp: async (email: string, pass: string) => {
    return await supabase.auth.signUp({ email, password: pass });
  },
  signIn: async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({ email, password: pass });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('ws_vault_accounts');
    localStorage.removeItem('ws_vault_transactions');
    localStorage.removeItem('ws_vault_goals');
  },
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
};

/**
 * Connection Health Check
 */
export const testConnection = async (): Promise<{ ok: boolean; message: string; latency?: number }> => {
  const start = performance.now();
  try {
    const { error } = await supabase.from('accounts').select('id').limit(1);
    const end = performance.now();
    if (error && error.code !== 'PGRST116') throw error; 
    return { ok: true, message: 'Cloud link established.', latency: Math.round(end - start) };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Check your Supabase URL/Key.' };
  }
};

const getLocal = (key: string): any[] => {
  const data = localStorage.getItem(`ws_vault_${key}`);
  return data ? JSON.parse(data) : [];
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(`ws_vault_${key}`, JSON.stringify(data));
};

// Global sync state for UI subscription
let onSyncChange: (status: SyncStatus, error?: string) => void = () => {};
export const subscribeToSync = (callback: (status: SyncStatus, error?: string) => void) => {
  onSyncChange = callback;
};

const formatError = (error: any): string => {
  if (typeof error === 'string') return error;
  return error?.message || JSON.stringify(error);
};

const createCollection = (name: string) => ({
  find: async () => {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const { data, error } = await supabase.from(name).select('*');
      if (!error && data) {
        setLocal(name, data);
        return data;
      }
    }
    return getLocal(name);
  },
  insertOne: async (doc: any) => {
    const all = getLocal(name);
    all.push(doc);
    setLocal(name, all);

    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      onSyncChange('syncing');
      try {
        const { error } = await supabase.from(name).insert([{ ...doc, user_id: user.user.id }]);
        if (error) {
          onSyncChange('error', formatError(error));
        } else {
          onSyncChange('synced');
        }
      } catch (e: any) {
        onSyncChange('error', formatError(e));
      }
    }
    return doc;
  },
  updateOne: async (query: any, update: any) => {
    const all = getLocal(name);
    const idx = all.findIndex(i => i.id === query.id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...update };
      setLocal(name, all);
    }

    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      onSyncChange('syncing');
      try {
        const { error } = await supabase.from(name).update(update).eq('id', query.id);
        if (error) onSyncChange('error', formatError(error));
        else onSyncChange('synced');
      } catch (e: any) {
        onSyncChange('error', formatError(e));
      }
    }
  },
  deleteOne: async (query: any) => {
    const all = getLocal(name);
    const filtered = all.filter(i => i.id !== query.id);
    setLocal(name, filtered);

    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      onSyncChange('syncing');
      try {
        const { error } = await supabase.from(name).delete().eq('id', query.id);
        if (error) onSyncChange('error', formatError(error));
        else onSyncChange('synced');
      } catch (e: any) {
        onSyncChange('error', formatError(e));
      }
    }
  }
});

export const db = {
  accounts: createCollection('accounts'),
  transactions: createCollection('transactions'),
  goals: createCollection('goals')
};

export const importVault = (data: any) => {
  if (data.accounts) setLocal('accounts', data.accounts);
  if (data.transactions) setLocal('transactions', data.transactions);
  if (data.goals) setLocal('goals', data.goals);
  window.location.reload();
};
