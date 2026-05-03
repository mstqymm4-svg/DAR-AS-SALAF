import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyStoredColors, applyStoredFont } from '@/pages/DevPanel'

// Apply saved customizations before render
applyStoredColors();
applyStoredFont();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)