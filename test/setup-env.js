import { JSDOM } from 'jsdom';

// 1. Initialize JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;

// 2. Set act environment flag for React
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// 3. Copy properties of window to globalThis safely
Object.getOwnPropertyNames(window).forEach((prop) => {
  if (prop !== 'undefined' && prop !== 'NaN' && prop !== 'Infinity' && !(prop in globalThis)) {
    try {
      globalThis[prop] = window[prop];
    } catch (e) {
      // Ignore properties that cannot be defined/copied
    }
  }
});

// Explicit assignments for safety
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  writable: true,
  configurable: true,
});

// 4. Mock localStorage using JSDOM's window.localStorage
globalThis.localStorage = window.localStorage;

// 5. Mock navigator clipboard
globalThis.navigator.clipboard = {
  writeText: async (text) => {
    globalThis.navigator.clipboard._text = text;
    return Promise.resolve();
  },
  readText: async () => {
    return Promise.resolve(globalThis.navigator.clipboard._text || '');
  },
  _text: '',
};

// 6. Stub crypto.getRandomValues
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
  writable: true,
  configurable: true,
});

// 7. Polyfill requestAnimationFrame
globalThis.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};
globalThis.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// 8. Mock fetch
globalThis.fetch = async (url, options) => {
  if (globalThis.__fetchMock) {
    return globalThis.__fetchMock(url, options);
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  });
};

// 9. Map import.meta.env values
globalThis.__import_meta_env__ = {
  MODE: 'test',
  DEV: true,
  PROD: false,
  SSR: false,
  VITE_API_URL: 'http://localhost/api',
};

// 10. Stub scroll methods
window.scrollTo = () => {};
window.Element.prototype.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};
globalThis.scrollTo = () => {};

// 11. Track and clear timeouts to avoid leak after unmount
const activeTimeouts = new Set();
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

globalThis.setTimeout = (callback, delay, ...args) => {
  const id = originalSetTimeout((...cbArgs) => {
    activeTimeouts.delete(id);
    callback(...cbArgs);
  }, delay, ...args);
  activeTimeouts.add(id);
  return id;
};

globalThis.clearTimeout = (id) => {
  activeTimeouts.delete(id);
  originalClearTimeout(id);
};

globalThis.__clearAllTimeouts = () => {
  for (const id of activeTimeouts) {
    originalClearTimeout(id);
  }
  activeTimeouts.clear();
};
