import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { migrateLegacySettings } from '@/lib/settingsStore'

// Migrate old dev_* localStorage keys to new system
migrateLegacySettings();

// Apply dark mode instantly before render (from new key, fallback old key)
try {
  const newDark = localStorage.getItem("devs_dark_mode");
  const oldDark = localStorage.getItem("dev_dark_mode");
  if ((newDark || oldDark) === "true") {
    document.documentElement.classList.add("dark");
  }
} catch(e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register Service Worker for PWA (installable app + offline support)
// In dev we still register the (corrected) worker so the browser immediately
// swaps it in (skipWaiting + clients.claim), replacing any STALE worker from a
// prior session that might otherwise cache-serve an old/broken Vite bundle —
// the root cause of "dispatcher.useState is null" hook errors. The corrected
// sw.js bypasses all Vite dev assets (JS/CSS/.vite/@vite/@react-refresh) and
// clears stale caches on activate, so HMR and dev JS always come from network.
if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    // Wipe any stale caches right away
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
    // Force-install the corrected worker; it replaces stale registrations
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}