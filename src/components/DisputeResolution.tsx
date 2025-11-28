import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, AlertCircle, Scale, Users, Star } from 'lucide-react';
import { AppHeader } from './AppHeader'; // Import AppHeader
import { Footer } from './Footer'; // Import Footer

// Re-defining Job interface for self-containment
export interface Job {
    id: string;
    title: string;
    description: string;
    budget: number;
    status: 'open' | 'in-progress' | 'completed' | 'dispute';
    employer: string;
    freelancer?: string;
    bids?: number;
}

interface DisputeResolutionProps {
  job: Job;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void; // New prop for theme toggle
  // Placeholder props for AppHeader actions
  onGetStarted: () => void;
  onShowProfile: () => void;
}

export function DisputeResolution({ job, onBack, isDarkMode, onToggleTheme, onGetStarted, onShowProfile }: DisputeResolutionProps) {
  const [disputeStep, setDisputeStep] = useState<'file' | 'pending' | 'voting'>('file');
  const [vote, setVote] = useState<'employer' | 'freelancer' | null>(null);

  const juryVotes = [
    { id: '1', juror: 'addr1abc...', vote: 'employer' as const, reputation: 4.9 },
    { id: '2', juror: 'addr1def...', vote: 'freelancer' as const, reputation: 4.7 },
    { id: '3', juror: 'addr1ghi...', vote: 'freelancer' as const, reputation: 4.8 },
    { id: '4', juror: 'addr1jkl...', vote: null, reputation: 4.6 },
    { id: '5', juror: 'addr1mno...', vote: null, reputation: 4.9 },
  ];

  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-100 border border-gray-300';
  const inputClass = isDarkMode ? 'bg-white/10 border-white/30 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';
  const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';

  const formatAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-4)}`;

  const handleFileDispute = () => {
    // Logic to submit dispute to smart contract
    console.log('Dispute filed for job:', job.id);
    setDisputeStep('pending');
  };

  const handleVote = (selection: 'employer' | 'freelancer') => {
    setVote(selection);
    // Logic to submit vote to smart contract
    console.log('Vote submitted for:', selection);
  };

  return (
    <div className={`min-h-screen ${rootClass} transition-colors flex flex-col`}>
      <AppHeader
        onGetStarted={onGetStarted}
        onShowProfile={onShowProfile}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
      <div className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full">
        <Button variant="ghost" onClick={onBack} className={`mb-6 ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Job Detail
        </Button>

        <Card className={`p-6 ${cardClass} space-y-6 shadow-xl`}>
          <div className="flex items-center gap-4 border-b pb-4">
            <Scale className="w-8 h-8 text-red-500" />
            <h2 className={`text-3xl font-bold text-red-500`}>Dispute Resolution</h2>
          </div>
          
          <div className="space-y-2">
            <h3 className={`text-xl font-semibold ${textForegroundClass}`}>{job.title}</h3>
            <p className={textMutedClass}>Escrow Amount: <span className="text-primary font-bold">{job.budget} ADA</span></p>
          </div>

          {/* FILE DISPUTE STEP */}
          {disputeStep === 'file' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg flex items-start gap-3 ${isDarkMode ? 'bg-yellow-800/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-1" />
                <p className='text-sm'>
                  Filing a dispute initiates the decentralized jury voting process. This action is irreversible and requires payment of a small network fee.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="reason" className={textForegroundClass}>Reason for Dispute (Mandatory Evidence)</label>
                <Textarea 
                  id="reason" 
                  rows={6} 
                  placeholder="Clearly explain why the work should be approved, rejected, or partially funded. Include block links to relevant chat history or file submissions."
                  className={inputClass}
                />
              </div>

              <Button onClick={handleFileDispute} className="w-full bg-red-600 hover:bg-red-700">
                Submit Dispute to Jury
              </Button>
            </div>
          )}

          {/* PENDING / VOTING STEP (Jury Assigned) */}
          {disputeStep === 'pending' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg flex items-start gap-3 ${isDarkMode ? 'bg-green-800/20 text-green-300' : 'bg-green-100 text-green-800'}`}>
                <Users className="w-5 h-5 flex-shrink-0 mt-1" />
                <p className='text-sm'>
                  Dispute successfully filed. A jury of 5 highly-reputable, anonymous users has been randomly selected and is reviewing the evidence.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-white border border-gray-200'}`}>
                <h4 className={`text-lg font-semibold mb-3 ${textForegroundClass}`}>Jury Status ({juryVotes.filter(j => j.vote !== null).length} / 5 Voted)</h4>
                <ul className="space-y-2">
                  {juryVotes.map((j, index) => (
                    <li key={j.id} className="flex items-center justify-between">
                      <span className={textMutedClass}>Juror {index + 1} ({formatAddress(j.juror)})</span>
                      <Badge 
                        variant={j.vote === null ? 'outline' : j.vote === 'employer' ? 'default' : 'secondary'} 
                        className={`w-20 justify-center capitalize ${j.vote === 'employer' && 'bg-red-500 hover:bg-red-500'} ${isDarkMode ? '' : 'text-gray-900 border-gray-300'}`}
                      >
                        {j.vote === 'employer' ? 'Client' : j.vote === 'freelancer' ? 'Worker' : 'Pending'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-primary/10 border border-primary/30' : 'bg-primary/5 border border-primary/20'}`}>\
                <p className={textMutedClass}>
                  You will be notified when all jury members have voted. The majority decision will be final and the escrow 
                  will be distributed accordingly.
                </p>
              </div>

              <Button variant="outline" onClick={onBack} className={`w-full ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}`}>
                Back to Job
              </Button>
            </div>
          )}
        </Card>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}