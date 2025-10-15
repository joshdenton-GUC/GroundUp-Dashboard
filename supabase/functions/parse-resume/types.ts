export interface CandidateInfo {
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  experience_years: string; // One of: "0", "2", "4", "7", "10"
  education: string;
  summary: string;
}

export type FileType = 'pdf' | 'docx' | 'unknown';

export interface ResumeParseRequest {
  resumeUrl: string;
}

export interface ResumeParseResponse {
  candidateInfo: CandidateInfo;
  error?: string;
}

export interface TextExtractionResult {
  text: string;
  fileType: FileType;
}
