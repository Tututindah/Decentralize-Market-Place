import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, CheckCircle, Upload } from 'lucide-react';
import { AppHeader } from './AppHeader'; // Import AppHeader
import { Footer } from './Footer'; // Import Footer

interface KYCVerificationProps {
  onComplete: () => void;
  onSkip: () => void;
  isDarkMode: boolean; // Added for theme consistency
  onToggleTheme: () => void; // New prop for theme toggle
  // Placeholder props for AppHeader actions
  onGetStarted: () => void;
  onShowProfile: () => void;
}

export function KYCVerification({ onComplete, onSkip, isDarkMode, onToggleTheme, onGetStarted, onShowProfile }: KYCVerificationProps) {
  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-50 border border-gray-300';
  const inputClass = isDarkMode ? 'bg-white/10 border-white/30 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';
  const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col ${rootClass} transition-colors`}>
      <AppHeader
        onGetStarted={onGetStarted}
        onShowProfile={onShowProfile}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
      {/* Space background effect (conditional) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-20'}`}
        style={{ backgroundImage: `radial-gradient(ellipse at center, ${isDarkMode ? 'var(--tw-color-primary-600) 0%, transparent 80%)' : 'var(--tw-color-primary-100) 0%, transparent 80%)'}`}}
      ></div>
      
      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <Card className={`w-full max-w-lg p-6 md:p-8 space-y-6 ${cardClass} shadow-2xl`}>
          <div className="text-center">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className={`text-3xl font-bold ${textForegroundClass}`}>KYC Verification</h2>
            <p className={textMutedClass}>Verify your identity to unlock higher reputation and security</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullname" className={textForegroundClass}>Full Legal Name</Label>
              <Input id="fullname" placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="idupload" className={textForegroundClass}>Upload ID Document (Encrypted)</Label>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${inputClass} cursor-pointer hover:opacity-90`}>
                <span className={textMutedClass}>Select file...</span>
                <Upload className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg space-y-3 ${isDarkMode ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
            <h3 className={`font-semibold ${textForegroundClass}`}>What You Get:</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p className={textForegroundClass}>Your credentials will be stored as a Verifiable Credential</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p className={textForegroundClass}>You'll receive a unique DID (Decentralized Identifier)</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p className={textForegroundClass}>Boost your reputation and get access to premium jobs</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1 bg-gradient-to-r from-secondary to-primary hover:opacity-90">
              Complete Verification
            </Button>
            <Button 
              onClick={onSkip} 
              variant="outline" 
              className={`flex-1 ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}`}
            >
              Skip for Now
            </Button>
          </div>

          <p className={textMutedClass + " text-center"}>
            You can complete this later from your profile settings
          </p>
        </Card>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}