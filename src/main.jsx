import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister all old service workers first
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    }).then(() => {
      // Register new service worker
      return navigator.serviceWorker.register('/artemis/sw.js', { scope: '/artemis/' });
    }).then(registration => {
      console.log('SW registered:', registration);
      // Force update check
      registration.update();
    }).catch(error => {
      console.log('SW registration failed:', error);
    });
  });
}
