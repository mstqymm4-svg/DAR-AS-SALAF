import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { migrateLegacySettings } from '@/lib/settingsStore'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'

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

// Register Service Worker for PWA (installable app + offline support).
// In dev we do NOT register a worker — we unregister any existing one and
// wipe caches, so a stale worker from a prior session can't cache-serve an
// old/broken Vite bundle (the root cause of "dispatcher.useState is null").
// Android (Capacitor): app files are already bundled locally, so skip the
// service worker; offline books stay in IndexedDB. Hardware back button
// navigates back inside the app and only exits from the first screen.
const isNativeApp = Capacitor.isNativePlatform();
if (isNativeApp) {
  CapApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else CapApp.exitApp();
  });
}

if (!isNativeApp && "serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}