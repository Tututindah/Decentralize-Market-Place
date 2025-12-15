'use client'

import dynamic from 'next/dynamic'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { WalletProvider } from '@/contexts/WalletContext'
import { UserProvider } from '@/contexts/UserContext'

// Dynamically import MeshProvider with SSR disabled to avoid undefined class extension errors
const MeshProvider = dynamic(
  () => import('@meshsdk/react').then((mod) => mod.MeshProvider),
  { ssr: false }
)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MeshProvider>
      <ThemeProvider>
        <WalletProvider>
          <UserProvider>
            {children}
            <Toaster />
          </UserProvider>
        </WalletProvider>
      </ThemeProvider>
    </MeshProvider>
  )
}
