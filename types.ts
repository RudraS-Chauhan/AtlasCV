
export interface ProjectDetails {
  id: string;
  name: string;
  link: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface UserInput {
  fullName: string;
  email: string;
  phone: string;
  linkedinGithub: string;
  careerObjective: string;
  education: string;
  skills: string;
  
  // Legacy string field (optional/derived)
  projects: string;
  // New structured field
  projectsList: ProjectDetails[];
  
  internships: string;
  certifications: string; // Legacy
  eventsAndCertifications: string; // New consolidated field
  
  yearsOfExperience: string;
  jobRoleTarget: string;
  company: string;
  whyThisRole: string;
  interests: string;
  currentYear: string;
  
  // Schooling
  school12th: string;
  school10th: string;
  
  // Legacy fields kept for compatibility if needed
  projectLink: string;
  projectStartDate: string;
  projectEndDate: string;
  customCSS: string;
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  title: string;
  description: string;
  tools: string[];
  milestones: string[];
  resources: { title: string; type: 'Course' | 'Book' | 'Tool' }[];
}

export interface JobToolkit {
  resume: string;
  coverLetter: string;
  linkedin: {
    headlines: string[]; // Changed to array for options
    bio: string;
  };
  mockInterview: {
    questions: {
      question: string;
      context: string; // Why this question is asked
      feedback: string; // Key talking points / Ideal answer structure
    }[];
  };
  careerRoadmap: RoadmapStep[];
  // Premium
  recruiterPsychology?: string;
  salaryNegotiation?: string;
}

export interface KeywordInsight {
    keyword: string;
    context: string; // New: Domain or category of the keyword
    reason: string;
    integrationTip: string;
}

export interface ResumeAnalysis {
  score: number;
  summary: string;
  missingKeywords: KeywordInsight[];
  strengths: string[];
  improvements: string[];
}

export interface ResumeVersion {
    id: string;
    role: string;
    content: string;
    timestamp: number;
}

export interface InterviewFeedback {
    rating: number;
    clarity: string;
    relevance: string;
    missingPoints: string[];
    sampleAnswer: string;
}