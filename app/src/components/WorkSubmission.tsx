import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Upload, File, CheckCircle } from 'lucide-react';
import { Job } from '../App';

interface WorkSubmissionProps {
  job: Job;
  onSubmit: () => void;
  onBack: () => void;
}

export function WorkSubmission({ job, onSubmit, onBack }: WorkSubmissionProps) {
  const [uploadStep, setUploadStep] = useState<'upload' | 'ipfs' | 'confirm'>('upload');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-foreground">Submit Your Work</h1>
            <p className="text-muted-foreground mt-2">
              Upload deliverables for: {job.title}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                uploadStep === 'upload' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'border-2 border-primary/30 text-muted-foreground'
              }`}>
                1
              </div>
              <span className={uploadStep === 'upload' ? 'text-foreground' : 'text-muted-foreground'}>Upload Files</span>
            </div>

            <div className="flex-1 h-0.5 bg-border mx-4" />

            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                uploadStep === 'ipfs' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'border-2 border-primary/30 text-muted-foreground'
              }`}>
                2
              </div>
              <span className={uploadStep === 'ipfs' ? 'text-foreground' : 'text-muted-foreground'}>IPFS Upload</span>
            </div>

            <div className="flex-1 h-0.5 bg-border mx-4" />

            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                uploadStep === 'confirm' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'border-2 border-primary/30 text-muted-foreground'
              }`}>
                3
              </div>
              <span className={uploadStep === 'confirm' ? 'text-foreground' : 'text-muted-foreground'}>Confirm</span>
            </div>
          </div>

          {/* Upload Step */}
          {uploadStep === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg p-12 text-center">
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="mb-2 text-foreground">Drag and drop files here</h3>
                <p className="text-muted-foreground mb-4">or click to browse</p>
                <Button variant="outline">Choose Files</Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground">Uploaded Files</h3>
                <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-foreground">dashboard-final.zip</p>
                      <p className="text-muted-foreground">2.4 MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Remove</Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-foreground">Delivery Notes</h3>
                <Textarea 
                  placeholder="Describe what you've delivered, installation instructions, or any important notes..."
                  rows={4}
                  className="bg-input/30"
                />
              </div>

              <Button onClick={() => setUploadStep('ipfs')} className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Continue to IPFS Upload
              </Button>
            </div>
          )}

          {/* IPFS Step */}
          {uploadStep === 'ipfs' && (
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="mb-2 text-foreground">Uploading to IPFS</h3>
                <p className="text-muted-foreground">Your files are being uploaded to the InterPlanetary File System...</p>
                <div className="mt-4">
                  <div className="w-full bg-input rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-muted-foreground mt-2">65% complete</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground">What is IPFS?</h3>
                <p className="text-muted-foreground">
                  IPFS (InterPlanetary File System) is a decentralized storage protocol. Your files are stored across a distributed network, ensuring permanence and censorship resistance.
                </p>
                <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                      <p className="text-foreground">Files cannot be deleted or modified</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                      <p className="text-foreground">Content addressed by cryptographic hash</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
                      <p className="text-foreground">Hash will be submitted to smart contract</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={() => setUploadStep('confirm')} className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Upload Complete - Continue
              </Button>
            </div>
          )}

          {/* Confirm Step */}
          {uploadStep === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-6 text-center">
                <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
                <h3 className="mb-2 text-foreground">Files Uploaded Successfully</h3>
                <p className="text-muted-foreground">Your work is ready to be submitted to the blockchain</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground">IPFS Hash</h3>
                <div className="bg-input/30 border border-primary/30 rounded-lg p-4 font-mono break-all text-primary">
                  QmX7ZfR3vXNPq5pXrTfGHa1b9cD8jK2mN4oP6qR7sT9uV5w
                </div>
                <p className="text-muted-foreground">
                  This hash is a unique identifier for your files on IPFS
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground">Transaction Details</h3>
                <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job:</span>
                    <span className="text-foreground">{job.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escrow Amount:</span>
                    <span className="text-primary">{job.budget} ADA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Files:</span>
                    <span className="text-foreground">1 file (2.4 MB)</span>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                <p className="text-muted-foreground">
                  By submitting, the IPFS hash will be recorded on-chain and the employer will be notified to review your work. 
                  Funds will be released upon approval.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={onSubmit} className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Submit to Blockchain
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

