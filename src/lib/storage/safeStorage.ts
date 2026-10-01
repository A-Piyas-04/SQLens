import toast from "react-hot-toast";

const STORAGE_FULL_TOAST_ID = "sqlens-storage-write-failed";

function notifyWriteFailed(): void {
  toast.error(
    "Browser storage is full or unavailable. SQLens keeps working, but some changes may not be saved.",
    { id: STORAGE_FULL_TOAST_ID, duration: 6000 }
  );
}

export function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false (and shows one non-blocking notice) instead of throwing on quota/private-mode errors. */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    notifyWriteFailed();
    return false;
  }
}

export function safeRemoveLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export function listLocalStorageKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}
