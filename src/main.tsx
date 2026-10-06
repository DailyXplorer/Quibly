import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isDemo } from './demo'
import { DemoApp } from './demo/DemoApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDemo ? <DemoApp /> : <App />}
  </StrictMode>,
)
