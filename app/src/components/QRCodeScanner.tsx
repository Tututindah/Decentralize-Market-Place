/**
 * QR Code Component for Identus Mobile Wallet Connection
 * Allows users to scan QR code with Identus mobile wallet (Android/iOS)
 */

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Smartphone, Copy, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

interface QRCodeScannerProps {
  connectionUrl: string;
  onConnectionEstablished?: () => void;
  isDarkMode?: boolean;
}

export function QRCodeScanner({ 
  connectionUrl, 
  onConnectionEstablished,
  isDarkMode = false 
}: QRCodeScannerProps) {
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Countdown timer for QR code expiration
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bgClass = isDarkMode 
    ? 'bg-zinc-900 border-zinc-800' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode 
    ? 'text-white font-semibold' 
    : 'text-black font-bold';
  
  const mutedClass = isDarkMode 
    ? 'text-gray-400' 
    : 'text-black';

  return (
    <Card className={`${bgClass} border-2`}>
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isDarkMode 
              ? 'bg-primary/20 border border-primary/30' 
              : 'bg-primary/10 border-2 border-primary/20'
          }`}>
            <Smartphone className="w-5 h-5 text-primary" />
            <span className={`font-bold ${textClass}`}>Scan with Identus Wallet</span>
          </div>
          <p className={`text-sm ${mutedClass}`}>
            Use your Identus mobile wallet to scan this QR code
          </p>
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-white' : 'bg-gray-50 border-2 border-gray-200'
          }`}>
            <QRCodeSVG
              value={connectionUrl}
              size={256}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className={`text-sm ${mutedClass}`}>
            QR code expires in{' '}
            <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </span>
          </p>
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
            isDarkMode 
              ? 'bg-primary/10 border-primary/30' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className={textClass}>Waiting for wallet connection...</span>
          </div>
        )}

        {/* Manual Connection URL */}
        <div className="space-y-2">
          <p className={`text-sm font-bold ${textClass}`}>Or copy connection URL:</p>
          <div className="flex gap-2">
            <div className={`flex-1 p-3 rounded-lg border font-mono text-xs break-all ${
              isDarkMode 
                ? 'bg-zinc-900 border-zinc-800 text-gray-300' 
                : 'bg-gray-50 border-gray-300 text-black'
            }`}>
              {connectionUrl.substring(0, 60)}...
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className={`shrink-0 ${
                isDarkMode 
                  ? 'border-zinc-700 hover:bg-zinc-800' 
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className={`p-4 rounded-lg border-2 space-y-3 ${
          isDarkMode 
            ? 'bg-zinc-800/50 border-zinc-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <p className={`font-bold ${textClass}`}>How to connect:</p>
          <ol className={`space-y-2 text-sm ${mutedClass}`}>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Download Identus Wallet from Google Play or App Store</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Open the app and tap "Scan QR Code"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Point your camera at the QR code above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Accept the connection request in your wallet</span>
            </li>
          </ol>
        </div>

        {/* Download Links */}
        <div className="flex gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=io.atalaprism.wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button 
              variant="outline" 
              className={`w-full border-2 ${
                isDarkMode 
                  ? 'border-slate-700 hover:bg-slate-800' 
                  : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </Button>
          </a>
          <a
            href="https://apps.apple.com/app/identus-wallet/id123456789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button 
              variant="outline" 
              className={`w-full border-2 ${
                isDarkMode 
                  ? 'border-slate-700 hover:bg-slate-800' 
                  : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
              </svg>
              App Store
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

