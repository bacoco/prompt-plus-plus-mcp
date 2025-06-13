import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/glass-morphism.css'
import './styles/responsive.css'
import './styles/button-fixes.css'
import App from './App.tsx'
// import TestApp from './App.test.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
