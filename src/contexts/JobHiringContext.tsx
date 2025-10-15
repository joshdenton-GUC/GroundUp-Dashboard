import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Interfaces
export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  type: 'full-time' | 'part-time' | 'contract' | 'temporary';
  classification: 'STANDARD' | 'PREMIUM';
  location: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
  status: 'draft' | 'posted' | 'filled' | 'paused' | 'canceled';
  dateCreated: string;
  datePosted?: string;
  currentCandidateId?: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  resumeFile?: File;
  resumeFileName?: string;
  experience: string;
  certifications: string;
  availability: string;
  location: string;
  status:
    | 'pending'
    | 'reviewing'
    | 'interviewing'
    | 'interviewed'
    | 'hired'
    | 'not_hired'
    | 'rejected';
  dateSubmitted: string;
  notes?: string;
}

export interface HiredEmployee {
  id: string;
  candidateId: string;
  jobId: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  hireDate: string;
  probationEndDate: string;
  status: 'active' | 'completed' | 'terminated';
}

// State interface
interface JobHiringState {
  companies: Company[];
  jobs: Job[];
  candidates: Candidate[];
  hiredEmployees: HiredEmployee[];
  companyTemplates: Partial<Company>[];
}

// Action types
type JobHiringAction =
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'SAVE_COMPANY_TEMPLATE'; payload: Partial<Company> }
  | { type: 'ADD_JOB'; payload: Job }
  | { type: 'UPDATE_JOB'; payload: { id: string; updates: Partial<Job> } }
  | { type: 'DELETE_JOB'; payload: string }
  | { type: 'ADD_CANDIDATE'; payload: Candidate }
  | {
      type: 'UPDATE_CANDIDATE';
      payload: { id: string; updates: Partial<Candidate> };
    }
  | { type: 'HIRE_CANDIDATE'; payload: { candidateId: string; jobId: string } }
  | { type: 'PASS_CANDIDATE'; payload: string }
  | { type: 'MOVE_TO_INTERVIEW'; payload: string }
  | { type: 'MARK_JOB_FILLED'; payload: string }
  | { type: 'MARK_JOB_CANCELED'; payload: string }
  | { type: 'LOAD_FROM_STORAGE'; payload: JobHiringState };

// Context interface
interface JobHiringContextType {
  state: JobHiringState;
  dispatch: React.Dispatch<JobHiringAction>;
  // Helper functions
  addCompany: (company: Omit<Company, 'id'>) => Company;
  saveCompanyTemplate: (company: Partial<Company>) => void;
  addJob: (job: Omit<Job, 'id' | 'dateCreated'>) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  addCandidate: (
    candidate: Omit<Candidate, 'id' | 'dateSubmitted'>
  ) => Candidate;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  hireCandidate: (candidateId: string, jobId: string) => void;
  passCandidate: (candidateId: string) => void;
  moveToInterview: (candidateId: string) => void;
  markJobFilled: (jobId: string) => void;
  markJobCanceled: (jobId: string) => void;
  getCurrentCandidate: (jobId: string) => Candidate | undefined;
  getJobsWithCandidates: () => (Job & { currentCandidate?: Candidate })[];
}

// Initial state
const initialState: JobHiringState = {
  companies: [],
  jobs: [],
  candidates: [],
  hiredEmployees: [],
  companyTemplates: [],
};

// Reducer
function jobHiringReducer(
  state: JobHiringState,
  action: JobHiringAction
): JobHiringState {
  switch (action.type) {
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };

    case 'SAVE_COMPANY_TEMPLATE':
      return {
        ...state,
        companyTemplates: [...state.companyTemplates, action.payload],
      };

    case 'ADD_JOB':
      return { ...state, jobs: [...state.jobs, action.payload] };

    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload.id
            ? { ...job, ...action.payload.updates }
            : job
        ),
      };
    case 'DELETE_JOB':
      return {
        ...state,
        jobs: state.jobs.filter(job => job.id !== action.payload),
        candidates: state.candidates.filter(
          candidate => candidate.jobId !== action.payload
        ),
      };

    case 'ADD_CANDIDATE':
      return { ...state, candidates: [...state.candidates, action.payload] };

    case 'UPDATE_CANDIDATE':
      return {
        ...state,
        candidates: state.candidates.map(candidate =>
          candidate.id === action.payload.id
            ? { ...candidate, ...action.payload.updates }
            : candidate
        ),
      };

    case 'HIRE_CANDIDATE': {
      const candidate = state.candidates.find(
        c => c.id === action.payload.candidateId
      );
      const job = state.jobs.find(j => j.id === action.payload.jobId);

      if (!candidate || !job) return state;

      const hireDate = new Date();
      const probationEndDate = new Date(hireDate);
      probationEndDate.setDate(probationEndDate.getDate() + 60);

      const hiredEmployee: HiredEmployee = {
        id: `hired_${Date.now()}`,
        candidateId: candidate.id,
        jobId: job.id,
        name: candidate.name,
        position: job.title,
        phone: candidate.phone,
        email: candidate.email,
        hireDate: hireDate.toISOString().split('T')[0],
        probationEndDate: probationEndDate.toISOString().split('T')[0],
        status: 'active',
      };

      return {
        ...state,
        candidates: state.candidates.map(c =>
          c.id === candidate.id ? { ...c, status: 'hired' as const } : c
        ),
        jobs: state.jobs.map(j =>
          j.id === job.id
            ? { ...j, status: 'filled' as const, currentCandidateId: undefined }
            : j
        ),
        hiredEmployees: [...state.hiredEmployees, hiredEmployee],
      };
    }

    case 'PASS_CANDIDATE':
      return {
        ...state,
        candidates: state.candidates.map(candidate =>
          candidate.id === action.payload
            ? { ...candidate, status: 'not_hired' as const }
            : candidate
        ),
      };

    case 'MOVE_TO_INTERVIEW':
      return {
        ...state,
        candidates: state.candidates.map(candidate =>
          candidate.id === action.payload
            ? { ...candidate, status: 'interviewing' as const }
            : candidate
        ),
      };

    case 'MARK_JOB_FILLED':
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload
            ? {
                ...job,
                status: 'filled' as const,
                currentCandidateId: undefined,
              }
            : job
        ),
        candidates: state.candidates.map(candidate =>
          candidate.jobId === action.payload
            ? { ...candidate, status: 'not_hired' as const }
            : candidate
        ),
      };

    case 'MARK_JOB_CANCELED':
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload
            ? {
                ...job,
                status: 'canceled' as const,
                currentCandidateId: undefined,
              }
            : job
        ),
        candidates: state.candidates.map(candidate =>
          candidate.jobId === action.payload
            ? { ...candidate, status: 'not_hired' as const }
            : candidate
        ),
      };

    case 'LOAD_FROM_STORAGE':
      return action.payload;

    default:
      return state;
  }
}

// Create context
const JobHiringContext = createContext<JobHiringContextType | undefined>(
  undefined
);

// Provider component
export function JobHiringProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(jobHiringReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('jobHiringData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedData });
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('jobHiringData', JSON.stringify(state));
  }, [state]);

  // Helper functions
  const addCompany = (companyData: Omit<Company, 'id'>): Company => {
    const company: Company = {
      ...companyData,
      id: `company_${Date.now()}`,
    };
    dispatch({ type: 'ADD_COMPANY', payload: company });
    return company;
  };

  const saveCompanyTemplate = (company: Partial<Company>) => {
    dispatch({ type: 'SAVE_COMPANY_TEMPLATE', payload: company });
  };

  const addJob = (jobData: Omit<Job, 'id' | 'dateCreated'>): Job => {
    const job: Job = {
      ...jobData,
      id: `job_${Date.now()}`,
      dateCreated: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_JOB', payload: job });
    return job;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    dispatch({ type: 'UPDATE_JOB', payload: { id, updates } });
  };

  const addCandidate = (
    candidateData: Omit<Candidate, 'id' | 'dateSubmitted'>
  ): Candidate => {
    const candidate: Candidate = {
      ...candidateData,
      id: `candidate_${Date.now()}`,
      dateSubmitted: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_CANDIDATE', payload: candidate });
    return candidate;
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    dispatch({ type: 'UPDATE_CANDIDATE', payload: { id, updates } });
  };

  const hireCandidate = (candidateId: string, jobId: string) => {
    dispatch({ type: 'HIRE_CANDIDATE', payload: { candidateId, jobId } });
  };

  const passCandidate = (candidateId: string) => {
    dispatch({ type: 'PASS_CANDIDATE', payload: candidateId });
  };

  const moveToInterview = (candidateId: string) => {
    dispatch({ type: 'MOVE_TO_INTERVIEW', payload: candidateId });
  };

  const markJobFilled = (jobId: string) => {
    dispatch({ type: 'MARK_JOB_FILLED', payload: jobId });
  };

  const markJobCanceled = (jobId: string) => {
    dispatch({ type: 'MARK_JOB_CANCELED', payload: jobId });
  };

  const getCurrentCandidate = (jobId: string): Candidate | undefined => {
    return state.candidates.find(
      candidate => candidate.jobId === jobId && candidate.status === 'reviewing'
    );
  };

  const getJobsWithCandidates = () => {
    return state.jobs.map(job => ({
      ...job,
      currentCandidate: getCurrentCandidate(job.id),
    }));
  };

  const value: JobHiringContextType = {
    state,
    dispatch,
    addCompany,
    saveCompanyTemplate,
    addJob,
    updateJob,
    addCandidate,
    updateCandidate,
    hireCandidate,
    passCandidate,
    moveToInterview,
    markJobFilled,
    markJobCanceled,
    getCurrentCandidate,
    getJobsWithCandidates,
  };

  return (
    <JobHiringContext.Provider value={value}>
      {children}
    </JobHiringContext.Provider>
  );
}

// Hook to use the context
export function useJobHiring() {
  const context = useContext(JobHiringContext);
  if (context === undefined) {
    throw new Error('useJobHiring must be used within a JobHiringProvider');
  }
  return context;
}
