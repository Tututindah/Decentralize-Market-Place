import React from "react";
import { ArrowLeft, Lock, Shield, Terminal, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { AppHeader } from './AppHeader'; // Import AppHeader
import { Footer } from './Footer'; // Import Footer

interface LearnMoreProps {
    onBack: () => void;
    isDarkMode: boolean; // Added for theme consistency
    onToggleTheme: () => void; // New prop for theme toggle
    // Placeholder props for AppHeader actions
    onGetStarted: () => void;
    onShowProfile: () => void;
}

export const LearnMore: React.FC<LearnMoreProps> = ({ onBack, isDarkMode, onToggleTheme, onGetStarted, onShowProfile }) => {
    const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
    const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';
    const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';

    return (
        <div className={`min-h-screen ${rootClass} transition-colors flex flex-col`}>
            <AppHeader
                onGetStarted={onGetStarted}
                onShowProfile={onShowProfile}
                isDarkMode={isDarkMode}
                onToggleTheme={onToggleTheme}
            />
            
            <div className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Button variant="ghost" onClick={onBack} className={`mb-6 ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>

                    <header className="text-center py-12">
                        <h1 className={`text-5xl font-extrabold mb-4 ${textForegroundClass}`}>
                            Our Principles of Decentralization
                        </h1>
                        <p className={`text-xl ${textMutedClass}`}>
                            Building a global, trustless, and resilient freelance ecosystem on Cardano.
                        </p>
                    </header>

                    <section className="space-y-12">
                        <div className={`p-6 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-50 border border-gray-300'}`}>
                            <div className="flex items-center mb-3">
                                <Lock className="w-7 h-7 mr-3 text-primary" />
                                <h2 className={`text-3xl font-bold ${textForegroundClass}`}>Trustless Escrow</h2>
                            </div>
                            <p className={textMutedClass + ' leading-relaxed'}>
                                Our core innovation is using Cardano's Plutus/Aiken smart contracts to manage funds. When a contract starts, the payment is locked in a validator script. The funds can only be released by a transaction that satisfies the script's logic—either mutual approval from the employer and freelancer, or a successful vote from the decentralized Jury. This eliminates counterparty risk and the need for traditional escrow services.
                            </p>
                        </div>
                        
                        <div className={`p-6 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-50 border border-gray-300'}`}>
                            <div className="flex items-center mb-3">
                                <Shield className="w-7 h-7 mr-3 text-secondary" />
                                <h2 className={`text-3xl font-bold ${textForegroundClass}`}>Dispute Resolution</h2>
                            </div>
                            <p className={textMutedClass + ' leading-relaxed'}>
                                In the event of a disagreement, neither the platform nor the users can unilaterally decide the outcome. Instead, a decentralized jury is randomly selected from a pool of vetted, high-reputation community members (e.g., stake pool operators). This jury reviews the on-chain evidence (communication ledger, submitted work proofs) and votes. A simple majority dictates how the escrowed funds are released, ensuring a fair and impartial resolution.
                            </p>
                        </div>
                        
                        <div className={`p-6 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-50 border border-gray-300'}`}>
                            <div className="flex items-center mb-3">
                                <Terminal className="w-7 h-7 mr-3 text-primary" />
                                <h2 className={`text-3xl font-bold ${textForegroundClass}`}>Immutable Ledger</h2>
                            </div>
                            <p className={textMutedClass + ' leading-relaxed'}>
                                All critical communication, contract amendments, and proofs of work are recorded as encrypted, auditable micro-ledgers on the Cardano blockchain. This provides an indisputable evidence trail. If a dispute occurs, the jury has a tamper-proof history to base their decision on. This feature drastically reduces ambiguity and provides cryptographic certainty.
                            </p>
                        </div>

                        <div className={`p-6 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-50 border border-gray-300'}`}>
                            <h2 className={`text-3xl font-bold mb-3 ${textForegroundClass}`}>Why Cardano?</h2>
                            <p className={textMutedClass + ' leading-relaxed'}>
                                Cardano's eUTXO model provides superior security and predictability for smart contracts (Plutus/Aiken). This architecture makes our trustless escrow system robust and virtually tamper-proof, ensuring funds are always safe until conditions are met.
                            </p>
                        </div>

                        <div className={`p-6 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-50 border border-gray-300'}`}>
                            <h2 className={`text-3xl font-bold mb-3 ${textForegroundClass}`}>Join the Movement</h2>
                            <p className={textMutedClass + ' leading-relaxed'}>
                                Whether you are a top-tier developer, a designer, or a technical writer, our platform offers the security and community you need to thrive in the decentralized world. Get started today and launch your first contract in ADA!
                            </p>
                        </div>
                    </section>
                </div>
            </div>
            <Footer isDarkMode={isDarkMode} />
        </div>
    );
};