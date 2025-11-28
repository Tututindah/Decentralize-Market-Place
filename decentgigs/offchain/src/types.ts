/**
 * ===================================================================
 * DecentGigs Type Definitions
 * ===================================================================
 *
 * This module defines all TypeScript types for the DecentGigs platform
 * including job postings, applications, milestones, and escrows.
 *
 * ===================================================================
 */

// ===================================================================
// JOB POSTING TYPES
// ===================================================================

/**
 * Job Category
 */
export enum JobCategory {
  WEB_DEVELOPMENT = "web_development",
  MOBILE_DEVELOPMENT = "mobile_development",
  BLOCKCHAIN = "blockchain",
  DESIGN = "design",
  WRITING = "writing",
  MARKETING = "marketing",
  OTHER = "other",
}

/**
 * Job Status in the System
 */
export enum JobStatus {
  OPEN = "open",                    // Accepting applications
  IN_PROGRESS = "in_progress",      // Freelancer working
  COMPLETED = "completed",          // All milestones released
  CANCELLED = "cancelled",          // Job cancelled
  DISPUTED = "disputed",            // In dispute resolution
}

/**
 * Milestone Definition
 */
export interface Milestone {
  /** Milestone number (1, 2, 3, etc.) */
  number: number;
  /** Description of milestone deliverables */
  description: string;
  /** Amount in USDM (in whole units, not atomic) */
  amount: number;
  /** Deadline timestamp (POSIX ms) */
  deadline: number;
  /** Whether this milestone has been released */
  released: boolean;
  /** Transaction hash when released (if released) */
  releaseTxHash?: string;
}

/**
 * Job Posting
 * Represents a job posted by an employer (offchain data)
 */
export interface JobPosting {
  /** Unique job ID */
  id: string;
  /** Job title */
  title: string;
  /** Detailed job description */
  description: string;
  /** Job category */
  category: JobCategory;
  /** Required skills (array of strings) */
  skills: string[];
  /** Total budget in USDM */
  budget: number;
  /** Payment milestones */
  milestones: Milestone[];
  /** Employer wallet address */
  employerAddress: string;
  /** Employer public key hash */
  employerPkh: string;
  /** Job status */
  status: JobStatus;
  /** Selected freelancer address (when accepted) */
  freelancerAddress?: string;
  /** Selected freelancer PKH (when accepted) */
  freelancerPkh?: string;
  /** Escrow transaction hash (when created) */
  escrowTxHash?: string;
  /** Escrow output index */
  escrowOutputIndex?: number;
  /** Timestamp when job was posted */
  createdAt: number;
  /** Timestamp when job was last updated */
  updatedAt: number;
}

// ===================================================================
// APPLICATION TYPES
// ===================================================================

/**
 * Application Status
 */
export enum ApplicationStatus {
  PENDING = "pending",      // Waiting for employer review
  ACCEPTED = "accepted",    // Employer accepted
  REJECTED = "rejected",    // Employer rejected
  WITHDRAWN = "withdrawn",  // Freelancer withdrew
}

/**
 * Freelancer Application
 * Represents a freelancer's application to a job
 */
export interface Application {
  /** Unique application ID */
  id: string;
  /** Job ID this application is for */
  jobId: string;
  /** Freelancer wallet address */
  freelancerAddress: string;
  /** Freelancer public key hash */
  freelancerPkh: string;
  /** Cover letter / proposal */
  proposal: string;
  /** Proposed timeline (in days) */
  proposedTimeline: number;
  /** Portfolio links */
  portfolioLinks?: string[];
  /** Application status */
  status: ApplicationStatus;
  /** Timestamp when applied */
  appliedAt: number;
  /** Timestamp when status last changed */
  statusChangedAt?: number;
}

// ===================================================================
// ESCROW TYPES
// ===================================================================

/**
 * Escrow Status
 */
export enum EscrowStatus {
  ACTIVE = "active",          // Escrow is active
  COMPLETED = "completed",    // All milestones released
  CANCELLED = "cancelled",    // Escrow cancelled
}

/**
 * On-Chain Escrow Information
 * Represents the actual blockchain escrow
 */
export interface EscrowInfo {
  /** Job ID reference */
  jobId: string;
  /** Transaction hash of escrow creation */
  txHash: string;
  /** Output index */
  outputIndex: number;
  /** Employer PKH */
  employerPkh: string;
  /** Freelancer PKH */
  freelancerPkh: string;
  /** Total locked amount (USDM atomic units) */
  totalAmount: bigint;
  /** Milestones (from datum) */
  milestones: Milestone[];
  /** Current milestone index */
  currentMilestone: number;
  /** Escrow creation timestamp */
  createdAt: number;
  /** Escrow status */
  status: EscrowStatus;
}

// ===================================================================
// MILESTONE RELEASE TYPES
// ===================================================================

/**
 * Milestone Release Request
 * Used when requesting milestone payment
 */
export interface MilestoneReleaseRequest {
  /** Job ID */
  jobId: string;
  /** Escrow UTxO reference */
  escrowTxHash: string;
  /** Escrow output index */
  escrowOutputIndex: number;
  /** Milestone index to release */
  milestoneIndex: number;
  /** Request timestamp */
  requestedAt: number;
  /** Employer has signed */
  employerSigned: boolean;
  /** Freelancer has signed */
  freelancerSigned: boolean;
}

// ===================================================================
// NOTIFICATION TYPES
// ===================================================================

/**
 * Notification Type
 */
export enum NotificationType {
  NEW_APPLICATION = "new_application",
  APPLICATION_ACCEPTED = "application_accepted",
  APPLICATION_REJECTED = "application_rejected",
  ESCROW_CREATED = "escrow_created",
  MILESTONE_REQUESTED = "milestone_requested",
  MILESTONE_RELEASED = "milestone_released",
  JOB_CANCELLED = "job_cancelled",
}

/**
 * User Notification
 */
export interface Notification {
  /** Notification ID */
  id: string;
  /** User address this notification is for */
  userAddress: string;
  /** Notification type */
  type: NotificationType;
  /** Title */
  title: string;
  /** Message content */
  message: string;
  /** Related job ID (if applicable) */
  jobId?: string;
  /** Read status */
  read: boolean;
  /** Timestamp */
  createdAt: number;
}

// ===================================================================
// DATABASE TYPES
// ===================================================================

/**
 * Database Interface
 * Simple interface for storing offchain data
 * Can be implemented with JSON files, SQLite, PostgreSQL, etc.
 */
export interface Database {
  // Job operations
  saveJob(job: JobPosting): Promise<void>;
  getJob(jobId: string): Promise<JobPosting | null>;
  listJobs(filters?: Partial<JobPosting>): Promise<JobPosting[]>;
  updateJob(jobId: string, updates: Partial<JobPosting>): Promise<void>;

  // Application operations
  saveApplication(application: Application): Promise<void>;
  getApplication(applicationId: string): Promise<Application | null>;
  listApplications(jobId: string): Promise<Application[]>;
  updateApplication(applicationId: string, updates: Partial<Application>): Promise<void>;

  // Escrow operations
  saveEscrow(escrow: EscrowInfo): Promise<void>;
  getEscrow(jobId: string): Promise<EscrowInfo | null>;
  updateEscrow(jobId: string, updates: Partial<EscrowInfo>): Promise<void>;

  // Notification operations
  saveNotification(notification: Notification): Promise<void>;
  listNotifications(userAddress: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
}

// ===================================================================
// API RESPONSE TYPES
// ===================================================================

/**
 * API Success Response
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API Error Response
 */
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

/**
 * API Response
 */
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// ===================================================================
// HELPER TYPES
// ===================================================================

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Sort Options
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}
