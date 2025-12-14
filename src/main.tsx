import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { MeshProvider } from '@meshsdk/react'

// Setup polyfills for Node.js globals required by Mesh SDK
import { Buffer } from 'buffer'
import process from 'process'

window.Buffer = Buffer
window.global = globalThis
window.process = process

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MeshProvider>
      <App />
    </MeshProvider>
  </React.StrictMode>,
)
