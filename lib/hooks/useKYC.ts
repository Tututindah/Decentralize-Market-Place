import { useState, useEffect } from 'react'
import {
  getKYCStatus,
  completeKYC,
  hasValidKYC,
  DIDDocument,
  KYCData,
  retrieveDID,
} from '@/lib/kyc/identus-mock'
import { useWallet } from '@/app/src/contexts/WalletContext'
import toast from 'react-hot-toast'

export function useKYC() {
  const { address } = useWallet()
  const [kycStatus, setKycStatus] = useState<{
    hasKYC: boolean
    verified: boolean
    did: string | null
    expirationDate: string | null
  }>({
    hasKYC: false,
    verified: false,
    did: null,
    expirationDate: null,
  })
  const [loading, setLoading] = useState(false)
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null)

  // Check KYC status on mount and when address changes
  useEffect(() => {
    if (address) {
      const status = getKYCStatus(address)
      setKycStatus(status)

      const did = retrieveDID(address)
      setDidDocument(did)
    }
  }, [address])

  const submitKYC = async (kycData: KYCData): Promise<DIDDocument | null> => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return null
    }

    setLoading(true)

    try {
      const didDoc = await completeKYC(address, kycData)

      setDidDocument(didDoc)
      setKycStatus({
        hasKYC: true,
        verified: true,
        did: didDoc.did,
        expirationDate:
          didDoc.credentials[0]?.expirationDate || null,
      })

      toast.success('KYC completed successfully!')
      return didDoc
    } catch (error: any) {
      console.error('KYC error:', error)
      toast.error(error?.message || 'KYC verification failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  const isVerified = () => {
    return address ? hasValidKYC(address) : false
  }

  return {
    kycStatus,
    didDocument,
    loading,
    submitKYC,
    isVerified,
    requiresKYC: !kycStatus.verified,
  }
}
