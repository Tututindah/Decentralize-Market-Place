/**
 * Reusable hooks for Cardano transactions
 * Simplifies transaction building, signing, and submission
 */

import { useState } from 'react'
import { useWallet } from '@/app/src/contexts/WalletContext'
import toast from 'react-hot-toast'

export interface TxState {
  loading: boolean
  txHash: string | null
  error: string | null
}

/**
 * Hook for managing transaction state
 */
export function useCardanoTx() {
  const { wallet, address, signTx, submitTx, getUtxos, getCollateral } = useWallet()
  const [state, setState] = useState<TxState>({
    loading: false,
    txHash: null,
    error: null,
  })

  const executeTx = async (
    buildTx: () => Promise<string>,
    options?: {
      onSuccess?: (txHash: string) => void
      onError?: (error: Error) => void
      successMessage?: string
    }
  ) => {
    if (!wallet || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setState({ loading: true, txHash: null, error: null })

    try {
      // Build unsigned transaction
      const unsignedTx = await buildTx()

      // Sign transaction
      const signedTx = await signTx(unsignedTx)

      // Submit to blockchain
      const txHash = await submitTx(signedTx)

      setState({ loading: false, txHash, error: null })

      toast.success(
        options?.successMessage || `Transaction submitted! ${txHash.slice(0, 10)}...`
      )

      options?.onSuccess?.(txHash)

      return txHash
    } catch (error: any) {
      console.error('Transaction error:', error)
      const errorMsg = error?.message || 'Transaction failed'

      setState({ loading: false, txHash: null, error: errorMsg })
      toast.error(errorMsg)

      options?.onError?.(error)
    }
  }

  const reset = () => {
    setState({ loading: false, txHash: null, error: null })
  }

  return {
    ...state,
    executeTx,
    reset,
    wallet,
    address,
    getUtxos,
    getCollateral,
  }
}

/**
 * Hook for managing multi-signature transactions
 */
export function useMultiSigTx() {
  const { wallet, address, signTx, submitTx } = useWallet()
  const [partialTx, setPartialTx] = useState<string | null>(null)
  const [fullySignedTx, setFullySignedTx] = useState<string | null>(null)

  const signAsFirst = async (unsignedTx: string): Promise<string> => {
    if (!wallet) throw new Error('Wallet not connected')

    // First party signs
    const signed = await signTx(unsignedTx, false)
    setPartialTx(signed)

    toast.success('Signed! Waiting for second signature...')
    return signed
  }

  const signAsSecond = async (partialSignedTx: string): Promise<string> => {
    if (!wallet) throw new Error('Wallet not connected')

    // Second party signs (partialSign=true)
    const signed = await signTx(partialSignedTx, true)
    setFullySignedTx(signed)

    return signed
  }

  const submitMultiSig = async (fullySigned?: string): Promise<string> => {
    const tx = fullySigned || fullySignedTx

    if (!tx) {
      throw new Error('No fully signed transaction available')
    }

    const txHash = await submitTx(tx)
    toast.success(`Multi-sig transaction submitted! ${txHash.slice(0, 10)}...`)

    // Reset state
    setPartialTx(null)
    setFullySignedTx(null)

    return txHash
  }

  return {
    partialTx,
    fullySignedTx,
    signAsFirst,
    signAsSecond,
    submitMultiSig,
  }
}

/**
 * Hook for checking transaction confirmation
 */
export function useTxConfirmation(txHash: string | null) {
  const [confirmations, setConfirmations] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  // Poll for transaction confirmation
  // Implementation would use Blockfrost API
  // For now, simplified version

  return {
    confirmations,
    confirmed,
  }
}
