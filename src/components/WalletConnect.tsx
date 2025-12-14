import { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { BrowserWallet } from '@meshsdk/core'
import './WalletConnect.css'

export default function WalletConnect() {
  const { connected, connecting, connectWallet, disconnectWallet } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const [availableWallets, setAvailableWallets] = useState<string[]>([])

  const checkWallets = async () => {
    const wallets = BrowserWallet.getInstalledWallets()
    setAvailableWallets(wallets.map(w => w.name))
    setShowModal(true)
  }

  const handleConnect = async (walletName: string) => {
    await connectWallet(walletName)
    setShowModal(false)
  }

  if (connected) {
    return (
      <button className="btn btn-danger" onClick={disconnectWallet}>
        Disconnect Wallet
      </button>
    )
  }

  return (
    <>
      <button 
        className="btn btn-primary" 
        onClick={checkWallets}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Select Wallet</h2>
            
            {availableWallets.length === 0 ? (
              <div className="no-wallets">
                <p>No Cardano wallets detected.</p>
                <p>Please install one of these wallets:</p>
                <ul>
                  <li><a href="https://namiwallet.io/" target="_blank">Nami</a></li>
                  <li><a href="https://eternl.io/" target="_blank">Eternl</a></li>
                  <li><a href="https://flint-wallet.com/" target="_blank">Flint</a></li>
                  <li><a href="https://yoroi-wallet.com/" target="_blank">Yoroi</a></li>
                </ul>
              </div>
            ) : (
              <div className="wallet-list">
                {availableWallets.map(walletName => (
                  <button
                    key={walletName}
                    className="wallet-option"
                    onClick={() => handleConnect(walletName)}
                  >
                    <span className="wallet-icon">👛</span>
                    <span className="wallet-name">{walletName}</span>
                  </button>
                ))}
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              onClick={() => setShowModal(false)}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
