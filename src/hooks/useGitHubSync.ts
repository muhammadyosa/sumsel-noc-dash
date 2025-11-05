import { useState, useEffect, useCallback } from 'react';
import { fetchGitHubFile, saveGitHubFile, isOnline, setupOnlineListeners } from '@/lib/github';

const SYNC_INTERVAL = 5000; // 5 seconds

export function useGitHubSync<T>(filename: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);

  // Fetch data from GitHub
  const fetchData = useCallback(async () => {
    if (!online) return;
    
    setSyncing(true);
    try {
      const result = await fetchGitHubFile(filename);
      if (result) {
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [filename, online]);

  // Save data to GitHub
  const saveData = useCallback(async (newData: T) => {
    if (!online) {
      // Save to localStorage as fallback
      localStorage.setItem(`offline_${filename}`, JSON.stringify(newData));
      setData(newData);
      return;
    }

    setSyncing(true);
    try {
      const success = await saveGitHubFile(filename, newData);
      if (success) {
        setData(newData);
        setLastUpdate(new Date());
        // Clear offline backup
        localStorage.removeItem(`offline_${filename}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      // Fallback to localStorage
      localStorage.setItem(`offline_${filename}`, JSON.stringify(newData));
      setData(newData);
    } finally {
      setSyncing(false);
    }
  }, [filename, online]);

  // Setup polling and online/offline listeners
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Setup polling
    const interval = setInterval(fetchData, SYNC_INTERVAL);

    // Setup online/offline listeners
    const cleanup = setupOnlineListeners(
      () => {
        setOnline(true);
        // When back online, sync any offline changes
        const offlineData = localStorage.getItem(`offline_${filename}`);
        if (offlineData) {
          try {
            const parsed = JSON.parse(offlineData);
            saveData(parsed);
          } catch (e) {
            console.error('Error syncing offline data:', e);
          }
        } else {
          fetchData();
        }
      },
      () => setOnline(false)
    );

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [fetchData, saveData, filename]);

  return {
    data,
    setData: saveData,
    lastUpdate,
    online,
    syncing
  };
}
