/**
 * ===================================================================
 * Simple JSON Database Implementation
 * ===================================================================
 *
 * This is a simple file-based database using JSON files.
 * For production, replace with PostgreSQL, MongoDB, or other database.
 *
 * ===================================================================
 */

import * as fs from "fs";
import * as path from "path";
import {
  Database,
  JobPosting,
  Application,
  EscrowInfo,
  Notification,
} from "./types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");
const ESCROWS_FILE = path.join(DATA_DIR, "escrows.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

/**
 * JSON File Database
 * Simple file-based storage for development and testing
 */
export class JsonDatabase implements Database {
  constructor() {
    this.ensureDataDir();
    this.ensureFiles();
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Ensure all data files exist
   */
  private ensureFiles(): void {
    const files = [JOBS_FILE, APPLICATIONS_FILE, ESCROWS_FILE, NOTIFICATIONS_FILE];

    for (const file of files) {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([], null, 2));
      }
    }
  }

  /**
   * Read JSON file
   */
  private readFile<T>(filePath: string): T[] {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Write JSON file
   */
  private writeFile<T>(filePath: string, data: T[]): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      throw error;
    }
  }

  // =================================================================
  // JOB OPERATIONS
  // =================================================================

  async saveJob(job: JobPosting): Promise<void> {
    const jobs = this.readFile<JobPosting>(JOBS_FILE);

    // Check if job already exists
    const existingIndex = jobs.findIndex((j) => j.id === job.id);

    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.push(job);
    }

    this.writeFile(JOBS_FILE, jobs);
  }

  async getJob(jobId: string): Promise<JobPosting | null> {
    const jobs = this.readFile<JobPosting>(JOBS_FILE);
    return jobs.find((j) => j.id === jobId) || null;
  }

  async listJobs(filters?: Partial<JobPosting>): Promise<JobPosting[]> {
    let jobs = this.readFile<JobPosting>(JOBS_FILE);

    if (filters) {
      jobs = jobs.filter((job) => {
        for (const [key, value] of Object.entries(filters)) {
          if (job[key as keyof JobPosting] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort by most recent first
    return jobs.sort((a, b) => b.createdAt - a.createdAt);
  }

  async updateJob(jobId: string, updates: Partial<JobPosting>): Promise<void> {
    const jobs = this.readFile<JobPosting>(JOBS_FILE);
    const index = jobs.findIndex((j) => j.id === jobId);

    if (index === -1) {
      throw new Error(`Job ${jobId} not found`);
    }

    jobs[index] = {
      ...jobs[index],
      ...updates,
      updatedAt: Date.now(),
    };

    this.writeFile(JOBS_FILE, jobs);
  }

  // =================================================================
  // APPLICATION OPERATIONS
  // =================================================================

  async saveApplication(application: Application): Promise<void> {
    const applications = this.readFile<Application>(APPLICATIONS_FILE);

    const existingIndex = applications.findIndex((a) => a.id === application.id);

    if (existingIndex >= 0) {
      applications[existingIndex] = application;
    } else {
      applications.push(application);
    }

    this.writeFile(APPLICATIONS_FILE, applications);
  }

  async getApplication(applicationId: string): Promise<Application | null> {
    const applications = this.readFile<Application>(APPLICATIONS_FILE);
    return applications.find((a) => a.id === applicationId) || null;
  }

  async listApplications(jobId: string): Promise<Application[]> {
    const applications = this.readFile<Application>(APPLICATIONS_FILE);
    return applications
      .filter((a) => a.jobId === jobId)
      .sort((a, b) => b.appliedAt - a.appliedAt);
  }

  async updateApplication(
    applicationId: string,
    updates: Partial<Application>
  ): Promise<void> {
    const applications = this.readFile<Application>(APPLICATIONS_FILE);
    const index = applications.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application ${applicationId} not found`);
    }

    applications[index] = {
      ...applications[index],
      ...updates,
      statusChangedAt: Date.now(),
    };

    this.writeFile(APPLICATIONS_FILE, applications);
  }

  // =================================================================
  // ESCROW OPERATIONS
  // =================================================================

  async saveEscrow(escrow: EscrowInfo): Promise<void> {
    const escrows = this.readFile<EscrowInfo>(ESCROWS_FILE);

    const existingIndex = escrows.findIndex((e) => e.jobId === escrow.jobId);

    if (existingIndex >= 0) {
      escrows[existingIndex] = escrow;
    } else {
      escrows.push(escrow);
    }

    this.writeFile(ESCROWS_FILE, escrows);
  }

  async getEscrow(jobId: string): Promise<EscrowInfo | null> {
    const escrows = this.readFile<EscrowInfo>(ESCROWS_FILE);
    return escrows.find((e) => e.jobId === jobId) || null;
  }

  async updateEscrow(jobId: string, updates: Partial<EscrowInfo>): Promise<void> {
    const escrows = this.readFile<EscrowInfo>(ESCROWS_FILE);
    const index = escrows.findIndex((e) => e.jobId === jobId);

    if (index === -1) {
      throw new Error(`Escrow for job ${jobId} not found`);
    }

    escrows[index] = {
      ...escrows[index],
      ...updates,
    };

    this.writeFile(ESCROWS_FILE, escrows);
  }

  // =================================================================
  // NOTIFICATION OPERATIONS
  // =================================================================

  async saveNotification(notification: Notification): Promise<void> {
    const notifications = this.readFile<Notification>(NOTIFICATIONS_FILE);
    notifications.push(notification);
    this.writeFile(NOTIFICATIONS_FILE, notifications);
  }

  async listNotifications(
    userAddress: string,
    unreadOnly?: boolean
  ): Promise<Notification[]> {
    const notifications = this.readFile<Notification>(NOTIFICATIONS_FILE);

    return notifications
      .filter((n) => {
        if (n.userAddress !== userAddress) return false;
        if (unreadOnly && n.read) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notifications = this.readFile<Notification>(NOTIFICATIONS_FILE);
    const index = notifications.findIndex((n) => n.id === notificationId);

    if (index >= 0) {
      notifications[index].read = true;
      this.writeFile(NOTIFICATIONS_FILE, notifications);
    }
  }
}

/**
 * Default database instance
 */
export const db = new JsonDatabase();
