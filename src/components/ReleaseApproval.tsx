import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { ArrowLeft, Download, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { AppHeader } from './AppHeader'; // Import AppHeader
import { Footer } from './Footer'; // Import Footer
import { Label } from './ui/label';

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

interface ReleaseApprovalProps {
  job: Job;
  onRelease: () => void;
  onBack: () => void;
  isDarkMode: boolean; // Added for theme consistency
  onToggleTheme: () => void; // New prop for theme toggle
  // Placeholder props for AppHeader actions
  onGetStarted: () => void;
  onShowProfile: () => void;
}

const StarRating: React.FC<{ rating: number, setRating: (r: number) => void, isDarkMode: boolean }> = ({ rating, setRating, isDarkMode }) => {
  return (
    <div className="flex justify-center space-x-1">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`w-8 h-8 cursor-pointer transition-transform ${
            index <= rating ? 'fill-yellow-500 text-yellow-500 scale-105' : isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-gray-300 hover:text-gray-500'
          }`}
          onClick={() => setRating(index)}
        />
      ))}
    </div>
  );
};

export function ReleaseApproval({ job, onRelease, onBack, isDarkMode, onToggleTheme, onGetStarted, onShowProfile }: ReleaseApprovalProps) {
  const [rating, setRating] = useState(0);
  const [showReview, setShowReview] = useState(false);

  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-gray-100 border border-gray-300';
  const inputClass = isDarkMode ? 'bg-white/10 border-white/30 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';
  const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${rootClass} transition-colors flex flex-col`}>
      <AppHeader
        onGetStarted={onGetStarted}
        onShowProfile={onShowProfile}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
      <div className="flex-grow max-w-xl mx-auto px-4 py-8 w-full">
        <Button variant="ghost" onClick={onBack} className={`mb-6 ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Job Detail
        </Button>

        <Card className={`p-6 ${cardClass} space-y-6 shadow-xl`}>
          <div className="text-center border-b pb-4">
            <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className={`text-3xl font-bold ${textForegroundClass}`}>Approve & Release</h2>
            <p className={textMutedClass}>Final step to complete the contract and release funds from escrow.</p>
          </div>

          <div className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-primary/10 border border-primary/30' : 'bg-primary/5 border border-primary/20'}`}>
            <p className={textForegroundClass + ' font-semibold'}>Funds to be released:</p>
            <span className="text-2xl font-bold text-secondary">{job.budget} ADA</span>
          </div>

          <div className="space-y-4">
            <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Submitted Work</h3>
            <p className={textMutedClass}>Please verify the submitted work package before approving the transaction.</p>
            <Button variant="outline" className={`w-full ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}`}>
              <Download className="w-4 h-4 mr-2" /> Download Work Files
            </Button>
          </div>

          <Separator className={isDarkMode ? 'bg-white/20' : 'bg-gray-300'} />
          
          <div className="space-y-4">
            {!showReview ? (
                <div className="flex justify-between items-center">
                    <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Confirm Approval?</h3>
                    <Button onClick={() => setShowReview(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                        Proceed to Review <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            ) : (
              <>
                <h3 className={`text-xl font-semibold ${textForegroundClass}`}>Leave a Review</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rating" className={textForegroundClass}>Rate the Freelancer (Mandatory)</Label>
                    <StarRating rating={rating} setRating={setRating} isDarkMode={isDarkMode} />
                  </div>
                  <div>
                    <Label htmlFor="feedback" className={textForegroundClass}>Feedback (Optional)</Label>
                    <Textarea id="feedback" rows={3} placeholder="Provide constructive feedback..." className={inputClass} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg space-y-3 ${isDarkMode ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`font-semibold ${textForegroundClass}`}>Transaction Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                      <p className={textMutedClass}>Freelancer's reputation score will be updated</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                      <p className={textMutedClass}>Transaction will be recorded on Cardano blockchain</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                      <p className={textMutedClass}>Both parties can leave feedback (visible after both submit)</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={onRelease} 
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90" 
                    disabled={rating === 0}
                  >
                    Confirm & Release {job.budget} ADA
                  </Button>
                  <Button variant="outline" onClick={() => setShowReview(false)} className={isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}