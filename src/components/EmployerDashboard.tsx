import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Search, Wallet, FileText, Clock, CheckCircle, Sparkles, X, User } from 'lucide-react';
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


interface EmployerDashboardProps {
  onJobSelect: (job: Job) => void;
  onGetStarted: () => void;
  onShowProfile: () => void;
}

export function EmployerDashboard({ onJobSelect, onGetStarted, onShowProfile }: EmployerDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', budget: 0 });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null); // State to track selected job for detail view

  const mockJobs: Job[] = [
    {
      id: '1',
      title: 'Build React Dashboard',
      description: 'Need a modern dashboard with charts and analytics',
      budget: 500,
      status: 'in-progress',
      employer: 'addr1employer1',
      freelancer: 'addr1freelancer1',
    },
    {
      id: '2',
      title: 'Plutus Smart Contract Audit',
      description: 'Audit a simple P2P escrow contract written in Aiken',
      budget: 1200,
      status: 'open',
      employer: 'addr1employer1',
      bids: 5,
    },
    {
      id: '3',
      title: 'Technical Writer for Whitepaper',
      description: 'Write a comprehensive whitepaper for our new DeFi protocol',
      budget: 800,
      status: 'completed',
      employer: 'addr1employer1',
      freelancer: 'addr1freelancer2',
    },
  ];

  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-100 border border-gray-300';
  const jobCardClass = isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-gray-200 hover:bg-gray-50';
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
      default:
        return 'outline';
    }
  };

  const handleCreateJob = () => {
    console.log('Job Created:', newJob);
    // Logic to add job to database goes here
    setShowCreateJob(false);
    setNewJob({ title: '', description: '', budget: 0 });
  };

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
        {/* Main Content Area */}
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-3xl font-bold ${textForegroundClass}`}>Employer Dashboard</h2>
          <div className='flex items-center space-x-3'>
            <Button onClick={() => setShowCreateJob(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Plus className="w-5 h-5 mr-2" /> Post New Job
            </Button>
          </div>
        </div>

        {/* Create Job Modal/Form */}
        {showCreateJob && (
          <Card className={`p-6 mb-8 ${cardClass} shadow-xl`}>
            <div className='flex justify-between items-center mb-4'>
              <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Post a New Job</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateJob(false)}>
                <X className={`w-5 h-5 ${textForegroundClass}`} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className={textForegroundClass}>Job Title</Label>
                <Input
                  id="title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget" className={textForegroundClass}>Budget (ADA)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newJob.budget > 0 ? newJob.budget : ''}
                  onChange={(e) => setNewJob({ ...newJob, budget: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="description" className={textForegroundClass}>Description</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleCreateJob} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={!newJob.title || !newJob.description || newJob.budget <= 0}>
                Post Job
              </Button>
            </div>
          </Card>
        )}

        {/* Job Listings */}
        <div className="space-y-6">
          <h3 className={`text-2xl font-semibold border-b pb-2 ${isDarkMode ? 'border-white/10' : 'border-gray-200'} ${textForegroundClass}`}>Your Active Jobs</h3>
          
          {mockJobs.map((job) => (
            <Card 
              key={job.id}
              className={`p-6 cursor-pointer transition-all ${jobCardClass}`}
              onClick={() => handleJobSelect(job)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className={textForegroundClass}>{job.title}</h3>
                    <Badge variant={getStatusVariant(job.status)} className={`capitalize ${isDarkMode ? '' : 'text-gray-900 border-gray-300'}`}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className={textMutedClass + ' mb-3'}>{job.description}</p>
                  <div className={`flex items-center gap-6 flex-wrap ${textMutedClass}`}>
                    <span className="text-primary font-semibold">{job.budget} ADA</span>
                    {job.bids && <span className={textMutedClass}>{job.bids} Bids</span>}
                    {job.freelancer && <span className={textMutedClass}>Freelancer: {formatAddress(job.freelancer)}</span>}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-primary/80" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}