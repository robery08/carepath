export type StoredDocument = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  file: Blob;
  extractedText: string;
  reviewNote: string;
};

const DATABASE_NAME = "carepath-local-documents";
const STORE_NAME = "documents";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support local document storage."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local document storage."));
    request.onblocked = () => reject(new Error("Close another CAREPATH tab and try again."));
  });
}

export async function saveDocumentFile(record: StoredDocument) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("The browser could not save this file."));
      transaction.onabort = () => reject(transaction.error ?? new Error("The browser cancelled this save."));
    });
  } finally {
    database.close();
  }
}

export async function getDocumentFile(id: string) {
  const database = await openDatabase();
  try {
    return await new Promise<StoredDocument | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as StoredDocument | undefined);
      request.onerror = () => reject(request.error ?? new Error("Could not open the saved document."));
    });
  } finally {
    database.close();
  }
}

export async function deleteDocumentFile(id: string) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete the saved document."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Document deletion was cancelled."));
    });
  } finally {
    database.close();
  }
}

export async function clearDocumentFiles() {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear saved documents."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Document cleanup was cancelled."));
    });
  } finally {
    database.close();
  }
}
