/**
 * Shared types for email templates
 */

export interface EmailContent {
  from: string;
  subject: string;
  html: string;
}

export interface NewJobPostedData {
  jobTitle: string;
  companyName: string;
  clientName: string;
  clientEmail: string;
  dashboardUrl: string;
}

export interface CandidateAssignedData {
  candidateName: string;
  candidateEmail: string;
  candidateSkills: string[];
  candidateSummary: string;
  clientName: string;
  companyName: string;
  dashboardUrl: string;
  clientEmail?: string;
}

export interface NoSaleJobStagedData {
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  signupDate: string;
  dashboardUrl: string;
}

export interface JobStatusUpdateData {
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  jobStatus: string;
  candidateName?: string;
  dashboardUrl: string;
}

export interface NewResumeUploadedData {
  candidateName: string;
  candidateEmail: string;
  resumeUrl?: string;
  dashboardUrl: string;
}

export interface ClientRegisteredData {
  clientName: string;
  clientEmail: string;
  companyName: string;
  signupDate: string;
  dashboardUrl: string;
}

export interface ResumeRejectionData {
  candidateName: string;
  candidateEmail: string;
  clientName: string;
  companyName: string;
  rejectionDate: string;
  dashboardUrl: string;
}
