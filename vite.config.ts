import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '')
  
  // Expose Vercel environment variables to the client
  const envWithProcessPrefix = Object.entries(env).reduce(
    (acc: Record<string, string>, [key, val]) => {
      // Forward all variables to the client
      // Including PRODUCTION_* and DEVELOPMENT_* variables
      acc[`import.meta.env.${key}`] = JSON.stringify(val)
      return acc
    },
    {} as Record<string, string>
  )
  
  return {
    plugins: [react()],
    server: {
      host: true, // Expose to all network interfaces
      port: 5173,
    },
    define: envWithProcessPrefix,
  }
})
