/**
 * Utility function to clear all locally stored data
 * This includes localStorage, sessionStorage, IndexedDB, and cookies
 */
export const clearAllLocalData = async (): Promise<void> => {
  try {
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                deleteReq.onsuccess = () => resolve(deleteReq.result);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      } catch (error) {
        console.warn('Error clearing IndexedDB:', error);
      }
    }

    // Clear cookies
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });

    console.log('All local data cleared successfully');
  } catch (error) {
    console.error('Error clearing local data:', error);
    throw error;
  }
};
