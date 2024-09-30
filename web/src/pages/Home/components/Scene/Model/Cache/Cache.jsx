// src/components/Cache/Cache.js
export async function openDB(name, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models");
        }
      };
    });
  }
  
  export async function getFromDB(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  export async function saveToDB(db, storeName, key, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
  