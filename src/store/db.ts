import localforage from 'localforage';
import { AnalysisRecord, WhitelistEntry } from '../types';

// Initialize stores
export const historyStore = localforage.createInstance({
  name: 'PhishOps',
  storeName: 'analysis_history',
  description: 'Stores large scale malicious payload analysis blobs'
});

export const whitelistStore = localforage.createInstance({
  name: 'PhishOps',
  storeName: 'whitelists',
  description: 'Verified organizational domain whitelists'
});

// History API
export const getHistory = async (): Promise<AnalysisRecord[]> => {
  const data = await historyStore.getItem<AnalysisRecord[]>('history');
  return data || [];
};

export const saveHistoryRecord = async (record: AnalysisRecord) => {
  const current = await getHistory();
  const exists = current.findIndex(r => r.id === record.id);
  
  if (exists >= 0) {
    current[exists] = record; // update if exists
  } else {
    current.unshift(record); // Add to top
  }
  
  await historyStore.setItem('history', current);
};

export const deleteHistoryRecord = async (id: string) => {
  const current = await getHistory();
  const updated = current.filter(r => r.id !== id);
  await historyStore.setItem('history', updated);
};

export const clearHistory = async () => {
  await historyStore.removeItem('history');
};

// Whitelist API
export const getWhitelists = async (): Promise<WhitelistEntry[]> => {
  const data = await whitelistStore.getItem<WhitelistEntry[]>('entries');
  return data || [];
};

export const saveWhitelistEntry = async (entry: WhitelistEntry) => {
  const current = await getWhitelists();
  current.push(entry);
  await whitelistStore.setItem('entries', current);
};

export const removeWhitelistEntry = async (domain: string) => {
  const current = await getWhitelists();
  const updated = current.filter(w => w.domain !== domain);
  await whitelistStore.setItem('entries', updated);
};
