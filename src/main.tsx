import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadAndApplySiteBranding } from './utils/siteBranding'

loadAndApplySiteBranding()

createRoot(document.getElementById('root')!).render(
  <App />,
)
