'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BrowserWallet } from '@meshsdk/core';
import { userService } from '@/app/src/services/user.service';

export type UserRole = 'EMPLOYER' | 'FREELANCER' | null;

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  initializing: boolean;
  address: string | null;
  balance: string | null;
  role: UserRole;
  userId: string | null;
  wallet: BrowserWallet | null;
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => void;
  setUserRole: (role: 'employer' | 'freelancer') => Promise<void>;
  getUtxos: () => Promise<any[]>;
  getCollateral: () => Promise<any[]>;
  signTx: (unsignedTx: string, partialSign?: boolean) => Promise<string>;
  submitTx: (signedTx: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);

  // Load saved wallet state on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    const savedRole = localStorage.getItem('user_role') as UserRole;
    const savedUserId = localStorage.getItem('user_id');
    const savedWalletName = localStorage.getItem('wallet_name');

    if (savedAddress && savedWalletName) {
      // Reconnect wallet
      (async () => {
        try {
          const { BrowserWallet } = await import('@meshsdk/core');
          const browserWallet = await BrowserWallet.enable(savedWalletName);
          
          // Verify the wallet address matches
          const addresses = await browserWallet.getUsedAddresses();
          const currentAddress = addresses[0];
          
          if (currentAddress !== savedAddress) {
            throw new Error('Wallet address mismatch');
          }

          setWallet(browserWallet);
          setAddress(savedAddress);
          
          // Restore role and userId if available
          if (savedRole && savedUserId) {
            setRole(savedRole);
            setUserId(savedUserId);
          }
          
          // Update balance
          try {
            const balanceData = await browserWallet.getBalance();
            const lovelaceBalance = balanceData[0]?.quantity || '0';
            const adaBalance = (parseInt(lovelaceBalance) / 1_000_000).toFixed(2);
            setBalance(adaBalance);
          } catch (balanceError) {
            console.warn('Failed to fetch balance:', balanceError);
          }
          
          setConnected(true);
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
          // Clear saved data if reconnection fails
          localStorage.removeItem('wallet_address');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_id');
          localStorage.removeItem('wallet_name');
          localStorage.removeItem('wallet_connected_at');
          localStorage.removeItem('wallet_signature');
        } finally {
          setInitializing(false);
        }
      })();
    } else {
      setInitializing(false);
    }
  }, []);

  const connectWallet = async (walletName: string) => {
    try {
      setConnecting(true);

      // Dynamically import BrowserWallet to avoid SSR issues
      const { BrowserWallet } = await import('@meshsdk/core');

      // Connect to browser wallet
      const browserWallet = await BrowserWallet.enable(walletName);
      setWallet(browserWallet);

      // Get wallet address
      const addresses = await browserWallet.getUsedAddresses();
      const walletAddress = addresses[0];
      
      // Verify wallet ownership with signature
      try {
        const message = `DecentGigs Login: ${new Date().toISOString()}`;
        const signature = await browserWallet.signData(walletAddress, message);
        
        // Store signature for verification
        localStorage.setItem('wallet_signature', JSON.stringify({ message, signature, timestamp: Date.now() }));
      } catch (signError) {
        console.warn('Signature verification skipped:', signError);
      }

      setAddress(walletAddress);

      // Get balance
      const balanceData = await browserWallet.getBalance();
      const lovelaceBalance = balanceData[0]?.quantity || '0';
      const adaBalance = (parseInt(lovelaceBalance) / 1_000_000).toFixed(2);
      setBalance(adaBalance);

      // Save to localStorage
      localStorage.setItem('wallet_address', walletAddress);
      localStorage.setItem('wallet_name', walletName);
      localStorage.setItem('wallet_connected_at', Date.now().toString());

      setConnected(true);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const setUserRole = async (userRole: 'employer' | 'freelancer') => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert to uppercase for database
      const dbRole = userRole.toUpperCase() as 'EMPLOYER' | 'FREELANCER';
      
      // Create or get user from database
      const user = await userService.getOrCreateUser(address, dbRole);

      setRole(dbRole);
      setUserId(user.id);

      // Save to localStorage with uppercase
      localStorage.setItem('user_role', dbRole);
      localStorage.setItem('user_id', user.id);
    } catch (error: any) {
      console.error('Failed to set user role:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAddress(null);
    setBalance(null);
    setRole(null);
    setUserId(null);
    setWallet(null);

    // Clear localStorage
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('wallet_name');
    localStorage.removeItem('wallet_connected_at');
    localStorage.removeItem('wallet_signature');
  };

  const getUtxos = async () => {
    if (!wallet) throw new Error('Wallet not connected');
    return await wallet.getUtxos();
  };

  const getCollateral = async () => {
    if (!wallet) throw new Error('Wallet not connected');
    return await wallet.getCollateral();
  };

  const signTx = async (unsignedTx: string, partialSign: boolean = false) => {
    if (!wallet) throw new Error('Wallet not connected');
    return await wallet.signTx(unsignedTx, partialSign);
  };

  const submitTx = async (signedTx: string) => {
    if (!wallet) throw new Error('Wallet not connected');
    return await wallet.submitTx(signedTx);
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        initializing,
        address,
        balance,
        role,
        userId,
        wallet,
        connectWallet,
        disconnectWallet,
        setUserRole,
        getUtxos,
        getCollateral,
        signTx,
        submitTx,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
