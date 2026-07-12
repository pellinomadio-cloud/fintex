// Robust Storage patch to prevent QuotaExceededError and SecurityError in sandboxed iframe environment
(function() {
  const memoryStorage: Record<string, string> = {};

  try {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      try {
        originalSetItem.call(this, key, value);
      } catch (e) {
        console.warn("Storage.setItem failed, falling back to memory:", key, e);
        memoryStorage[key] = String(value);
      }
    };
  } catch (err) {
    console.warn("Failed to patch Storage.prototype.setItem:", err);
  }

  try {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key: string) {
      try {
        const val = originalGetItem.call(this, key);
        if (val !== null) return val;
      } catch (e) {
        // Fallback to memory below
      }
      return key in memoryStorage ? memoryStorage[key] : null;
    };
  } catch (err) {
    console.warn("Failed to patch Storage.prototype.getItem:", err);
  }

  try {
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key: string) {
      try {
        originalRemoveItem.call(this, key);
      } catch (e) {
        // Fallback to memory below
      }
      delete memoryStorage[key];
    };
  } catch (err) {
    console.warn("Failed to patch Storage.prototype.removeItem:", err);
  }

  try {
    const originalClear = Storage.prototype.clear;
    Storage.prototype.clear = function() {
      try {
        originalClear.call(this);
      } catch (e) {
        // Fallback to memory below
      }
      for (const key in memoryStorage) {
        delete memoryStorage[key];
      }
    };
  } catch (err) {
    console.warn("Failed to patch Storage.prototype.clear:", err);
  }

  // Also catch and handle window.localStorage and window.sessionStorage access security errors
  try {
    const testLocal = window.localStorage;
    if (!testLocal) throw new Error("localStorage is null");
  } catch (e) {
    console.warn("Direct localStorage access is blocked or throws. Setting up memory fallback object.");
    const mockStorage = {
      length: 0,
      clear: () => {
        for (const key in memoryStorage) delete memoryStorage[key];
      },
      getItem: (key: string) => (key in memoryStorage ? memoryStorage[key] : null),
      setItem: (key: string, value: string) => { memoryStorage[key] = String(value); },
      removeItem: (key: string) => { delete memoryStorage[key]; },
      key: (index: number) => Object.keys(memoryStorage)[index] || null
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true });
    } catch (err) {
      (window as any).localStorage = mockStorage;
    }
  }

  try {
    const testSession = window.sessionStorage;
    if (!testSession) throw new Error("sessionStorage is null");
  } catch (e) {
    console.warn("Direct sessionStorage access is blocked or throws. Setting up memory fallback object.");
    const mockSession = {
      length: 0,
      clear: () => {
        for (const key in memoryStorage) delete memoryStorage[key];
      },
      getItem: (key: string) => (key in memoryStorage ? memoryStorage[key] : null),
      setItem: (key: string, value: string) => { memoryStorage[key] = String(value); },
      removeItem: (key: string) => { delete memoryStorage[key]; },
      key: (index: number) => Object.keys(memoryStorage)[index] || null
    };
    try {
      Object.defineProperty(window, 'sessionStorage', { value: mockSession, configurable: true });
    } catch (err) {
      (window as any).sessionStorage = mockSession;
    }
  }
})();
