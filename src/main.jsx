import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyStoredColors, applyStoredFont } from '@/pages/DevPanel'

// Apply saved customizations before render
applyStoredColors();
applyStoredFont();

// Apply dark mode (persistent)
try {
  if (localStorage.getItem("dev_dark_mode") === "true") {
    document.documentElement.classList.add("dark");
  }
} catch(e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)