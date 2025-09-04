import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handler for scroll-related errors
window.addEventListener('error', (event) => {
  const error = event.error;
  if (error && error.message && error.message.includes('scrollTop')) {
    console.warn('Caught scroll-related error:', error.message);
    event.preventDefault(); // Prevent the error from breaking the app
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error && error.message && error.message.includes('scrollTop')) {
    console.warn('Caught scroll-related promise rejection:', error.message);
    event.preventDefault(); // Prevent the error from breaking the app
  }
});

// Conditionally load iOS styles only on iOS devices
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS) {
  import('./styles/ios.css');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
