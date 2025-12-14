// Polyfills for Node.js globals required by Mesh SDK and crypto libraries
// This file must be imported FIRST before any other imports
import { Buffer } from 'buffer'
import process from 'process'

// Set up global variables
globalThis.Buffer = Buffer
globalThis.global = globalThis
globalThis.process = process

// Ensure window also has these (for browser context)
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
  window.global = globalThis
  window.process = process
}

// Export to ensure this module is included
export { Buffer, process }
