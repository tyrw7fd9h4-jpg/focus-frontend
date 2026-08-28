import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthInitializer } from './components/AuthInitializer.tsx'
const queryClient = new QueryClient({defaultOptions:{mutations:{retry:0}}})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}><AuthInitializer><App /></AuthInitializer></QueryClientProvider>
  </StrictMode>,
)
