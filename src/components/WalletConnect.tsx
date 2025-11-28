import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Wallet, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UserType } from '../App';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';

export interface WalletConnectProps {
    onConnect: (userType: UserType) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [step, setStep] = useState<'wallet' | 'user-type'>('wallet');
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

    const wallets = [
        { id: 'nami', name: 'Nami Wallet', status: 'Detected' },
        { id: 'eternl', name: 'Eternl', status: 'Not Installed' },
        { id: 'flint', name: 'Flint Wallet', status: 'Not Installed' },
        { id: 'typhon', name: 'Typhon Wallet', status: 'Not Installed' },
    ];

    const handleWalletSelect = (walletId: string) => {
        setSelectedWallet(walletId);
        // Simulate connection delay
        setTimeout(() => {
            setStep('user-type');
        }, 800);
    };

    const handleUserTypeSelect = (type: UserType) => {
        onConnect(type);
    };
    
    // Theme-specific classes
    const containerClasses = `min-h-screen relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`;
    const foregroundText = isDarkMode ? 'text-white' : 'text-black';
    const mutedText = isDarkMode ? 'text-white/60' : 'text-gray-600';
    const cardBaseClasses = isDarkMode 
        ? 'bg-black/50 border-white/20 backdrop-blur-sm' 
        : 'bg-white/90 border-gray-200 shadow-xl';
    
    // Background glow/grid
    const gridStyle = `bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDIsIDIsIDIsIDAuMDgpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]`;
    
    return (
        <div className={containerClasses}>
            <AppHeader isDarkMode={isDarkMode} onToggleTheme={toggleTheme} onGetStarted={() => {}} onShowProfile={() => {}} />
            {/* Background Effect (Only visible in Dark Mode for that glossy look) */}
            {isDarkMode && (
                <>
                    {/* Radial Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-black to-black opacity-80" />
                    {/* Subtle Grid */}
                    <div className={`absolute inset-0 ${gridStyle} opacity-10`} />
                </>
            )}

            {/* Content Area */}
            <div className="relative z-10 p-4">
                <div className="max-w-xl mx-auto pt-16 md:pt-32 pb-16">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-xl">
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                        <h1 className={`text-3xl font-bold ${foregroundText}`}>{step === 'wallet' ? 'Connect Your Wallet' : 'Select Your Role'}</h1>
                        <p className={`mt-2 ${mutedText} text-lg`}>
                            {step === 'wallet'
                                ? 'Choose your Cardano wallet to continue'
                                : 'Are you looking to hire or work?'
                            }
                        </p>
                    </div>

                    {step === 'wallet' ? (
                        <div className="space-y-4">
                            {wallets.map((wallet) => (
                                <Card
                                    key={wallet.id}
                                    className={`p-5 cursor-pointer border-2 transition-all duration-300 ${cardBaseClasses}`}
                                    style={{ boxShadow: isDarkMode ? '0 5px 15px rgba(139, 92, 246, 0.1)' : '0 5px 15px rgba(0, 0, 0, 0.05)' }}
                                    onClick={() => wallet.status === 'Detected' && handleWalletSelect(wallet.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                                                <Wallet className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className={`text-lg font-semibold ${foregroundText}`}>{wallet.name}</div>
                                                <div className={mutedText}>{wallet.status}</div>
                                            </div>
                                        </div>
                                        {selectedWallet === wallet.id && (
                                            <div className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-full flex items-center gap-2 shadow-lg shadow-primary/30">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                Connecting...
                                            </div>
                                        )}
                                        {wallet.status !== 'Detected' && (
                                             <div className="px-4 py-2 bg-gray-500/20 text-gray-400 font-medium rounded-full">
                                                Install
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}

                            <div className="text-center pt-8">
                                <p className={mutedText}>Don't have a wallet?</p>
                                <Button variant="link" className="text-primary hover:opacity-80 transition-opacity">Learn how to set up a Cardano wallet</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Employer Card */}
                            <Card
                                className={`p-8 cursor-pointer border-2 transition-all duration-300 hover:border-primary/80 ${cardBaseClasses}`}
                                onClick={() => handleUserTypeSelect('employer')}
                                style={{ boxShadow: isDarkMode ? '0 5px 15px rgba(139, 92, 246, 0.15)' : '0 5px 15px rgba(0, 0, 0, 0.1)' }}
                            >
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/40 rounded-xl mx-auto flex items-center justify-center shadow-md">
                                        <CheckCircle2 className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${foregroundText}`}>I'm an Employer</h3>
                                    <p className={mutedText}>Post jobs, manage proposals, and hire talented freelancers</p>
                                    <div className="pt-4">
                                        <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                                            Continue as Employer
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Freelancer Card */}
                            <Card
                                className={`p-8 cursor-pointer border-2 transition-all duration-300 hover:border-secondary/80 ${cardBaseClasses}`}
                                onClick={() => handleUserTypeSelect('freelancer')}
                                style={{ boxShadow: isDarkMode ? '0 5px 15px rgba(255, 165, 0, 0.15)' : '0 5px 15px rgba(0, 0, 0, 0.1)' }}
                            >
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 border-2 border-secondary/40 rounded-xl mx-auto flex items-center justify-center shadow-md">
                                        <CheckCircle2 className="w-8 h-8 text-secondary" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${foregroundText}`}>I'm a Freelancer</h3>
                                    <p className={mutedText}>Find secure, decentralized work and get paid via smart contract escrow</p>
                                    <div className="pt-4">
                                        <Button className="w-full bg-gradient-to-r from-secondary to-primary hover:opacity-90 shadow-lg shadow-secondary/20 transition-all">
                                            Continue as Freelancer
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="text-center pt-4">
                                <Button variant="ghost" onClick={() => setStep('wallet')} className={mutedText + " hover:text-primary transition-colors"}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to wallet selection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer isDarkMode={isDarkMode} />
        </div>
    );
}