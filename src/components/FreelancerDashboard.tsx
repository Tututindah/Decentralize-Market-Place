import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Wallet, FileText, Clock, Star, Sparkles, User, Settings, X } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { P2PChat } from './P2PChat'; // Import the new P2P Chat component
import { AppHeader } from './AppHeader'; // Import AppHeader
import { Footer } from './Footer'; // Import Footer

// Re-defining Job interface for self-containment
export interface Job {
    id: string;
    title: string;
    description: string;
    budget: number;
    status: 'open' | 'in-progress' | 'completed';
    employer: string;
    freelancer?: string;
    bids?: number;
}

interface FreelancerDashboardProps {
  onJobSelect: (job: Job) => void;
  onShowProfile: () => void;
  onSettingProfile: () => void;
  onGetStarted: () => void;
}

export function FreelancerDashboard({ onJobSelect, onShowProfile, onSettingProfile, onGetStarted }: FreelancerDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null); // State to track selected job for detail view
  
  const myActiveJobs: Job[] = [
    {
      id: '6',
      title: 'Aiken Smart Contract Dev',
      description: 'Develop and test a DEX contract on Cardano testnet.',
      budget: 1500,
      status: 'in-progress',
      employer: 'addr1employer3',
      freelancer: 'addr1freelancer1',
      bids: 1,
    },
    {
        id: '7',
        title: 'Cardano DApp Frontend',
        description: 'Implement a modern UI for a DApp using React/TypeScript.',
        budget: 900,
        status: 'in-progress',
        employer: 'addr1employer4',
        freelancer: 'addr1freelancer1',
        bids: 1,
    },
  ];

  const availableJobs: Job[] = [
    {
      id: '8',
      title: 'Plutus Pioneer Mentor',
      description: 'Need a senior dev to mentor a team on Plutus/Haskell',
      budget: 2000,
      status: 'open',
      employer: 'addr1employer5',
      bids: 12,
    },
    {
      id: '9',
      title: 'NFT Metadata Standard Implementation',
      description: 'Help implement the CIP-25 standard for a new NFT collection.',
      budget: 450,
      status: 'open',
      employer: 'addr1employer6',
      bids: 7,
    },
  ];

  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-100 border border-gray-300';
  const jobCardClass = isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-gray-200 hover:bg-gray-50';
  const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';

  const formatAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-4)}`;

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    onJobSelect(job); // Delegate to App component to show detail view
  };

  return (
    <div className={`min-h-screen ${rootClass} transition-colors flex flex-col`}>
      <AppHeader
        onGetStarted={onGetStarted}
        onShowProfile={onShowProfile}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      <div className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar/Profile Card */}
          <div className="lg:col-span-3">
            <Card className={`p-6 ${cardClass} space-y-4 sticky top-20`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${textForegroundClass}`}>My Profile</h3>
                <Button variant="ghost" size="icon" onClick={onSettingProfile} className={isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}>
                    <Settings className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-16 h-16 mb-3">
                  <AvatarFallback className="bg-primary text-white text-2xl font-bold">A</AvatarFallback>
                </Avatar>
                <h4 className={`text-lg font-semibold ${textForegroundClass}`}>Adam Smith</h4>
                <p className={textMutedClass}>Plutus Developer | DID: 1234...</p>
              </div>
              
              <div className="flex justify-around border-t pt-4 space-x-2">
                <div className="text-center">
                  <p className={`text-xl font-bold text-primary`}>4.8</p>
                  <p className={textMutedClass}>Reputation</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-bold ${textForegroundClass}`}>15</p>
                  <p className={textMutedClass}>Jobs Done</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content (Job Listings) */}
          <div className="lg:col-span-9 space-y-10">
            
            {/* My Active Jobs */}
            <div className="space-y-6">
              <h3 className={`text-2xl font-semibold border-b pb-2 ${isDarkMode ? 'border-white/10' : 'border-gray-200'} ${textForegroundClass}`}>My Active Contracts</h3>
              {myActiveJobs.map((job) => (
                <Card 
                  key={job.id}
                  className={`p-6 cursor-pointer transition-all ${jobCardClass}`}
                  onClick={() => handleJobSelect(job)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className={textForegroundClass}>{job.title}</h3>
                        <Badge variant="secondary" className={`capitalize ${isDarkMode ? 'text-gray-900 border-primary/50' : 'text-gray-900 border-primary/50'}`}>
                          {job.status}
                        </Badge>
                      </div>
                      <p className={textMutedClass + ' mb-3'}>{job.description}</p>
                      <div className={`flex items-center gap-6 flex-wrap ${textMutedClass}`}>
                        <span className="text-primary font-semibold">{job.budget} ADA</span>
                        <span>Posted by {formatAddress(job.employer)}</span>
                      </div>
                    </div>
                    <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">View Contract</Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Available Jobs */}
            <div className="space-y-6">
              <h3 className={`text-2xl font-semibold border-b pb-2 ${isDarkMode ? 'border-white/10' : 'border-gray-200'} ${textForegroundClass}`}>Available Gigs</h3>
              <div className="flex gap-4 mb-6">
                <Input 
                  type="search" 
                  placeholder="Search for Cardano, Plutus, Aiken..." 
                  className={`flex-grow ${isDarkMode ? 'bg-white/10 border-white/30 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} 
                />
                <Button variant="outline" size="icon" className={isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}>
                    <Search className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <Card 
                    key={job.id}
                    className={`p-6 cursor-pointer transition-all ${jobCardClass}`}
                    onClick={() => handleJobSelect(job)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className={textForegroundClass}>{job.title}</h3>
                          <Badge variant="outline" className={`capitalize ${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300 text-gray-900'}`}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className={textMutedClass + ' mb-3'}>{job.description}</p>
                        <div className={`flex items-center gap-6 flex-wrap ${textMutedClass}`}>
                          <span className="text-primary font-semibold">{job.budget} ADA</span>
                          <span>{job.bids} Bids</span>
                          <span>Posted by {formatAddress(job.employer)}</span>
                        </div>
                      </div>
                      <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">Submit Bid</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}