import { createRoot } from 'react-dom/client'
import App from './App'
import { installApi } from './api'
import './assets/index.css'

installApi()
createRoot(document.getElementById('root')).render(<App />)
