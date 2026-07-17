import { act } from 'react';
import { createRoot } from 'react-dom/client';

let root = null;
let container = null;

/**
 * Renders a React component inside a clean JSDOM container wrapped in React act().
 * @param {React.ReactElement} Component
 * @returns {Promise<HTMLDivElement>} The container element
 */
export async function renderApp(Component, clearStorage = true) {
  // Ensure previous app is cleaned up
  await cleanupApp(clearStorage);

  container = document.createElement('div');
  container.id = 'app-root-container';
  document.body.appendChild(container);
  
  root = createRoot(container);
  
  await act(async () => {
    root.render(Component);
  });
  
  // Wait for any microtasks to flush
  await new Promise((resolve) => setTimeout(resolve, 0));
  
  return container;
}

/**
 * Unmounts the React app and removes its container from JSDOM.
 */
export async function cleanupApp(clearStorage = true) {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
    container = null;
  }
  
  // Clear mock states
  if (clearStorage) {
    localStorage.clear();
  }
  globalThis.__fetchMock = null;
  if (globalThis.__clearAllTimeouts) {
    globalThis.__clearAllTimeouts();
  }
  
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Dispatches a click event on the given element wrapped in React act().
 * @param {HTMLElement} element 
 */
export async function clickButton(element) {
  if (!element) {
    throw new Error('Cannot click on a null or undefined element');
  }
  
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Updates an input's value and dispatches input/change events wrapped in React act().
 * @param {HTMLInputElement|HTMLTextAreaElement} element 
 * @param {string} value 
 */
export async function typeInput(element, value) {
  if (!element) {
    throw new Error('Cannot type into a null or undefined element');
  }
  
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new window.Event('input', { bubbles: true }));
    element.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Polls the DOM until the specified text is present or the timeout expires.
 * @param {string} text 
 * @param {number} timeout 
 * @returns {Promise<boolean>}
 */
export async function waitForText(text, timeout = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (document.body.textContent.includes(text)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for text "${text}" to appear in DOM. Current DOM: ${document.body.innerHTML}`);
}

/**
 * Registers a global fetch mock handler.
 * @param {Function} handler 
 */
export function mockFetch(handler) {
  globalThis.__fetchMock = handler;
}

/**
 * Helper to mock JSON fetch responses.
 * @param {object} jsonData 
 * @param {boolean} ok 
 * @param {number} status 
 */
export function mockFetchJson(jsonData, ok = true, status = 200) {
  mockFetch(() => Promise.resolve({
    ok,
    status,
    json: async () => jsonData,
    text: async () => JSON.stringify(jsonData),
  }));
}
