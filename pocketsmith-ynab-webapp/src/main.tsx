import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
