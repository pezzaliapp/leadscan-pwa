import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Registrazione service worker (PWA installabile + offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', window.location.href).toString()
    navigator.serviceWorker.register(swUrl).catch((err) => {
      console.warn('SW non registrato:', err)
    })
  })
}
