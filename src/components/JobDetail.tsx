import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ArrowLeft, Lock, Upload, CheckCircle, AlertCircle, Sparkles, User, Star } from 'lucide-react';
import { AppHeader } from './AppHeader'; // Import AppHeader
import { Footer } from './Footer'; // Import Footer

// Re-defining Job and UserType interface for self-containment
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
type UserType = 'employer' | 'freelancer' | 'guest';

interface JobDetailProps {
  job: Job;
  userType: UserType;
  onBack: () => void;
  onWorkSubmission: () => void;
  onApproval: () => void;
  onDispute: () => void;
  isDarkMode: boolean; // Added for theme consistency
  onToggleTheme: () => void; // New prop for theme toggle
  // Placeholder props for AppHeader actions
  onGetStarted: () => void;
  onShowProfile: () => void;
}

export function JobDetail({ job, userType, onBack, onWorkSubmission, onApproval, onDispute, isDarkMode, onToggleTheme, onGetStarted, onShowProfile }: JobDetailProps) {
  const [showBidForm, setShowBidForm] = useState(false);

  const mockBids = [
    { id: '1', freelancer: 'addr1abc...', amount: 450, proposal: 'I have 5 years of experience in React development...', reputation: 4.8 },
    { id: '2', freelancer: 'addr1def...', amount: 480, proposal: 'I can deliver this project within 7 days...', reputation: 4.5 },
    { id: '3', freelancer: 'addr1ghi...', amount: 520, proposal: 'Expert in modern web development with portfolio...', reputation: 4.9 },
  ];

  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-100 border border-gray-300';
  const inputClass = isDarkMode ? 'bg-white/10 border-white/30 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';
  const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';

  const formatAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-4)}`;

  const getStatusVariant = (status: Job['status']): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'dispute':
        return 'default'; // Using default for dispute, but style primary
      default:
        return 'outline';
    }
  };

  const isMyJob = job.freelancer === 'addr1freelancer1'; // Mock check

  return (
    <div className={`min-h-screen ${rootClass} transition-colors flex flex-col`}>
        <AppHeader
            onGetStarted={onGetStarted}
            onShowProfile={onShowProfile}
            isDarkMode={isDarkMode}
            onToggleTheme={onToggleTheme}
        />
        <div className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
            <Button variant="ghost" onClick={onBack} className={`mb-6 ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}`}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className={`p-6 ${cardClass} space-y-4`}>
                        <div className="flex justify-between items-start">
                            <h2 className={`text-3xl font-bold ${textForegroundClass}`}>{job.title}</h2>
                            <Badge 
                                variant={getStatusVariant(job.status)} 
                                className={`capitalize text-lg px-4 py-1 ${job.status === 'dispute' ? 'bg-red-600 text-white hover:bg-red-700' : isDarkMode ? '' : 'text-gray-900 border-gray-300'}`}
                            >
                                {job.status === 'dispute' ? 'Dispute' : job.status}
                            </Badge>
                        </div>
                        <div className={`flex items-center gap-4 ${textMutedClass} text-lg font-semibold`}>
                            <span className="text-primary font-bold text-2xl">{job.budget} ADA</span>
                            <span>|</span>
                            <span>Posted by {formatAddress(job.employer)}</span>
                        </div>
                        <Separator className={isDarkMode ? 'bg-white/20' : 'bg-gray-300'} />
                        <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Description</h3>
                        <p className={textMutedClass + ' leading-relaxed'}>
                            {job.description}
                        </p>
                        
                        {/* Freelancer/Employer Status Actions */}
                        {(job.status === 'in-progress') && (
                            <div className={`p-4 rounded-lg mt-6 ${isDarkMode ? 'bg-primary/10 border border-primary/30' : 'bg-primary/5 border border-primary/20'}`}>
                                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-primary-900'}`}>
                                    {isMyJob ? 'Your Active Contract' : 'Freelancer Assigned'}
                                </h4>
                                <p className={textMutedClass}>
                                    {isMyJob ? `Submit your work once completed. The employer will review it before the ${job.budget} ADA is released from escrow.` : `The freelancer (${formatAddress(job.freelancer!)}) is currently working on this job.`}
                                </p>
                                <div className="mt-4 flex gap-3 flex-wrap">
                                    {isMyJob && (
                                        <Button onClick={onWorkSubmission} className="bg-secondary hover:bg-secondary/90">
                                            <Upload className="w-4 h-4 mr-2" /> Submit Work
                                        </Button>
                                    )}
                                    {!isMyJob && userType === 'employer' && (
                                        <>
                                            <Button onClick={onApproval} className="bg-green-600 hover:bg-green-700">Approve & Release Funds</Button>
                                            <Button onClick={onDispute} variant="destructive">File Dispute</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {job.status === 'open' && userType === 'freelancer' && !showBidForm && (
                            <div className="flex justify-center pt-6">
                                <Button onClick={() => setShowBidForm(true)} className="text-lg px-8 py-3 bg-gradient-to-r from-secondary to-primary hover:opacity-90">
                                    Place a Bid
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Bidding Section (Employer View) */}
                    {job.status === 'open' && userType === 'employer' && (
                        <Card className={`p-6 ${cardClass} space-y-4`}>
                            <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Bids ({mockBids.length})</h3>
                            {mockBids.map((bid) => (
                                <div key={bid.id} className={`p-4 rounded-lg flex justify-between items-center transition-colors ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                                    <div>
                                        <p className={`font-semibold ${textForegroundClass}`}>Bidder: {formatAddress(bid.freelancer)}</p>
                                        <p className={textMutedClass}>Budget: <span className="text-primary font-bold">{bid.amount} ADA</span></p>
                                        <p className={textMutedClass}>Reputation: <span className="text-secondary mr-1">⭐ {bid.reputation}</span></p>
                                        <p className={textMutedClass + ' mt-2 text-sm italic'}>{bid.proposal.slice(0, 50)}...</p>
                                    </div>
                                    <Button className="bg-green-600 hover:bg-green-700">Hire</Button>
                                </div>
                            ))}
                        </Card>
                    )}

                    {/* Bid Form (Freelancer View) */}
                    {job.status === 'open' && userType === 'freelancer' && showBidForm && (
                        <Card className={`p-6 ${cardClass} space-y-4`}>
                            <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Submit Your Bid</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="bidAmount" className={textForegroundClass}>Bid Amount (ADA)</Label>
                                    <Input id="bidAmount" type="number" placeholder="e.g., 470" className={inputClass} />
                                </div>
                                <div>
                                    <Label htmlFor="proposal" className={textForegroundClass}>Your Proposal</Label>
                                    <Textarea id="proposal" rows={5} placeholder="Describe your experience and why you are the best fit..." className={inputClass} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowBidForm(false)} className={isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}>
                                    Cancel
                                </Button>
                                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                                    Submit Bid
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className={`p-6 ${cardClass} space-y-4`}>
                        <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Employer Details</h3>
                        <div className={`flex items-center gap-3 ${textMutedClass}`}>
                            <User className="w-5 h-5 text-primary" />
                            <p className={textForegroundClass}>{formatAddress(job.employer)}</p>
                        </div>
                        <div className={`flex items-center gap-3 ${textMutedClass}`}>
                            <Star className="w-5 h-5 text-secondary" />
                            <span className="text-secondary mr-1">⭐ 4.7</span>
                            <span className={textMutedClass}>(23 reviews)</span>
                        </div>
                        <Separator className={isDarkMode ? 'bg-white/20' : 'bg-gray-300'} />
                        <div className={`space-y-2 ${textMutedClass}`}>
                            <p>Jobs Posted: 12</p>
                            <p>Hire Rate: 85%</p>
                            <p>Member Since: Jan 2025</p>
                        </div>
                    </Card>

                    <Card className={`p-6 ${cardClass} space-y-4`}>
                        <h3 className={`text-lg font-semibold ${textForegroundClass} mb-3`}>Payment Safety</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 text-primary" />
                                <p className={textMutedClass}>Funds locked in Aiken validator</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 text-primary" />
                                <p className={textMutedClass}>Automatic release on approval</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                                <p className={textMutedClass}>Dispute resolution available</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
        <Footer isDarkMode={isDarkMode} />
    </div>
  );
}