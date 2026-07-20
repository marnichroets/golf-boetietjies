import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { GolfDataProvider } from './context/GolfDataContext.jsx'
import { LocalPlayerProvider } from './context/LocalPlayerContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LocalPlayerProvider>
        <GolfDataProvider>
          <App />
        </GolfDataProvider>
      </LocalPlayerProvider>
    </BrowserRouter>
  </StrictMode>,
)
