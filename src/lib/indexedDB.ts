import { ExcelRecord } from "@/types/ticket";
import { OLT } from "@/types/olt";

const DB_NAME = "NOC_Database";
const STORE_NAME = "excel_data";
const OLT_STORE_NAME = "olt_data";
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(OLT_STORE_NAME)) {
        db.createObjectStore(OLT_STORE_NAME);
      }
    };
  });
}

export async function saveExcelData(data: ExcelRecord[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, "excel_records");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadExcelData(): Promise<ExcelRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("excel_records");

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error loading Excel data from IndexedDB:", error);
    return [];
  }
}

export async function clearExcelData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete("excel_records");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// OLT Data functions
export async function saveOLTData(data: OLT[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OLT_STORE_NAME], "readwrite");
    const store = transaction.objectStore(OLT_STORE_NAME);
    const request = store.put(data, "olt_records");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadOLTData(): Promise<OLT[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([OLT_STORE_NAME], "readonly");
      const store = transaction.objectStore(OLT_STORE_NAME);
      const request = store.get("olt_records");

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error loading OLT data from IndexedDB:", error);
    return [];
  }
}

export async function clearOLTData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OLT_STORE_NAME], "readwrite");
    const store = transaction.objectStore(OLT_STORE_NAME);
    const request = store.delete("olt_records");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
