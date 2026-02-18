import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis, InterviewFeedback } from '../types';

const extractJson = (text: string): string => {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) return "{}";
  return text.substring(startIndex, endIndex + 1);
};

const generateWithFallback = async (modelName: string, prompt: string, config: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: config,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback to a lightweight model if the primary fails
    try {
        const fallback = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: { ...config, thinkingConfig: undefined }
        });
        return fallback.text || "";
    } catch (fallbackError) {
        console.error("Fallback Error:", fallbackError);
        return "";
    }
  }
};

export const generateJobToolkit = async (data: UserInput): Promise<JobToolkit> => {
  const projectsString = data.projectsList && data.projectsList.length > 0 
      ? data.projectsList.map((p, i) => `${i+1}. ${p.name} (${p.startDate} - ${p.endDate}) [${p.link}]: ${p.description}`).join('\n')
      : data.projects;

  // Enhanced system instruction for human-like, high-impact content
  const systemInstruction = `You are an elite Career Strategist and Executive Resume Writer known for creating "human-centric" yet high-performance job applications. 
  
  YOUR GOAL: Generate a Job Toolkit that sounds authentic, professional, and distinctively NOT AI-generated.
  
  WRITING RULES:
  1.  **NO ROBOTIC PHRASES**: Avoid "I am writing to express my interest", "passionate about", "synergies", "delve into", or "showcase". Use direct, active language.
  2.  **RESUME**: Use the "Google XYZ Formula" (Accomplished [X] as measured by [Y], by doing [Z]). If metrics aren't provided, focus on the *impact* and *scale* of the work. Use strong verbs like "Architected", "Engineered", "Orchestrated", not just "Worked on" or "Helped".
  3.  **COVER LETTER**: Use a storytelling approach. Hook the reader in the first sentence with a specific achievement or connection to the company's mission. Do not summarize the resume; explain the *motivation*.
  4.  **LINKEDIN**: Conversational and authoritative (1st person). Use hooks. Avoid being dry.
  
  STRICT JSON OUTPUT FORMAT REQUIRED:
  {
    "resume": "Markdown string. Use ### for section headers.",
    "coverLetter": "Markdown string. Professional but engaging tone.",
    "linkedin": {
      "headlines": ["Headline 1 (Role | Key Skill | USP)", "Headline 2", "Headline 3"],
      "bio": "Engaging 'About' section for LinkedIn. Use 1st person."
    },
    "mockInterview": {
      "questions": [
        { "question": "Q1", "context": "Context", "feedback": "Tips" },
        // ... up to 10
      ]
    },
    "careerRoadmap": [
      { "phase": "Week 1-2", "title": "Step 1", "description": "Details", "tools": ["Tool A"], "milestones": ["Done X"] },
      // ... up to 4 steps
    ]
  }`;
  
  const prompt = `
  Generate a bespoke Job Toolkit for:
  CANDIDATE: ${data.fullName}
  TARGET ROLE: ${data.jobRoleTarget}
  TARGET COMPANY: ${data.company}
  MOTIVATION: ${data.whyThisRole}
  INTERESTS: ${data.interests}
  
  RAW DATA:
  - Skills: ${data.skills}
  - Experience: ${data.internships}
  - Projects: ${projectsString}
  - Education: ${data.education}
  - Schooling: Class 12: ${data.school12th}, Class 10: ${data.school10th}
  - Bio Input: ${data.careerObjective}
  
  INSTRUCTIONS:
  1. **Resume**: Optimize for ${data.jobRoleTarget} at ${data.company}. Tailor the summary and skills to align with ${data.company}'s known values or industry standing. If project descriptions are weak, enhance them with technical details.
  2. **Cover Letter**: Address it to the hiring manager at ${data.company}. Weave in the candidate's motivation ("${data.whyThisRole}") naturally.
  3. **LinkedIn**: Create 3 distinct headlines (one creative, one professional, one keyword-heavy).
  4. **Interview**: Generate 10 challenging questions specific to ${data.jobRoleTarget} at ${data.company}. Include behavioral questions that check for culture fit.
  5. **Roadmap**: 4 concrete steps to land this role at ${data.company}.
  `;
  
  // Using slightly higher temperature for more natural/creative phrasing
  const responseText = await generateWithFallback('gemini-3-flash-preview', prompt, {
    responseMimeType: "application/json",
    temperature: 0.4,
    systemInstruction
  });
  
  try {
    const json = JSON.parse(extractJson(responseText));
    
    // Default Fallbacks
    if (!json.resume) json.resume = "## Error Generating Resume\nPlease try regenerating.";
    if (!json.coverLetter) json.coverLetter = "Error generating cover letter.";
    if (!json.linkedin || !json.linkedin.headlines) json.linkedin = { headlines: ["Software Engineer", "Developer"], bio: "Passionate developer..." };
    if (!json.mockInterview || !json.mockInterview.questions) json.mockInterview = { questions: [] };
    if (!json.careerRoadmap) json.careerRoadmap = [];

    return json;
  } catch (e) {
    console.error("JSON Parse Error", e);
    return {
        resume: "Error generating content. Please try again.",
        coverLetter: "",
        linkedin: { headlines: [], bio: "" },
        mockInterview: { questions: [] },
        careerRoadmap: []
    };
  }
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
  const systemInstruction = `You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Algorithm Specialist. 
  Your goal is to optimize the resume specifically for the role of "${jobRole}".
  
  Analyze the resume text deeply. Identify high-impact technical skills, industry keywords, and soft skills that are missing but crucial for this role to pass automated filters.

  Return a strictly valid JSON object with this structure:
  {
    "score": number (0-100),
    "summary": "A concise executive summary of the resume's current standing.",
    "missingKeywords": [
        {
            "keyword": "The specific missing term (e.g., 'Docker')",
            "context": "The domain/category where this fits (e.g., 'Containerization', 'Agile Methodology', 'Core Java')",
            "reason": "Why this is non-negotiable for ${jobRole}.",
            "integrationTip": "A specific, natural sentence or bullet point example showing exactly how to include this in the resume (e.g., 'Update Project X to say: Orchestrated deployment using [keyword] to reduce downtime...')"
        }
    ],
    "strengths": ["List 3 key strengths found"],
    "improvements": ["List 3 actionable formatting or content improvements"]
  }
  
  CRITICAL: 
  - Provide at least 5 missing keywords.
  - Ensure 'integrationTip' is NOT generic. Synthesize a plausible bullet point based on the resume's probable context.
  - Be strict with the score.
  `;

  const responseText = await generateWithFallback('gemini-3-flash-preview', resumeText, {
    responseMimeType: "application/json",
    temperature: 0.1,
    systemInstruction
  });
  return JSON.parse(extractJson(responseText));
};

export const generateEliteTools = async (data: UserInput): Promise<Partial<JobToolkit>> => {
    const prompt = `Generate JSON: { "recruiterPsychology": "text", "salaryNegotiation": "text" } for role ${data.jobRoleTarget}.`;
    const responseText = await generateWithFallback('gemini-3-flash-preview', prompt, {
        responseMimeType: "application/json",
        temperature: 0.2
    });
    return JSON.parse(extractJson(responseText));
};

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinking: boolean): Promise<any> => {
    const model = useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    // Incorporate user profile for better tailoring
    const prompt = `
    Context: Candidate with skills "${data.skills}" and background "${data.education}".
    Task: Create a 4-step career roadmap to become a "${newRole}".
    Focus: Bridge the gap between current skills and target role requirements.
    Output: Return strictly a JSON object with a "careerRoadmap" array.
    `;
    const config: any = { responseMimeType: "application/json" };
    if (useThinking) config.thinkingConfig = { thinkingBudget: 1024 };
    const responseText = await generateWithFallback(model, prompt, config);
    return JSON.parse(extractJson(responseText));
};

export const analyzeInterviewAnswer = async (question: string, userAnswer: string, role: string, company: string): Promise<InterviewFeedback> => {
    const systemInstruction = `You are a senior hiring manager at ${company} interviewing a candidate for a ${role} position. 
    Analyze the candidate's answer to the question: "${question}".
    
    Provide output in strict JSON format:
    {
        "rating": number (1-10),
        "clarity": "Feedback on clarity and conciseness",
        "relevance": "Feedback on relevance to the role/company",
        "missingPoints": ["Key point 1 to add", "Key point 2 to add"],
        "sampleAnswer": "A concise, ideal response example"
    }`;

    const responseText = await generateWithFallback('gemini-3-flash-preview', `Candidate Answer: "${userAnswer}"`, {
        responseMimeType: "application/json",
        temperature: 0.2,
        systemInstruction
    });
    return JSON.parse(extractJson(responseText));
};

export const parseProfileData = async (text: string): Promise<Partial<UserInput>> => {
    const prompt = `Extract user profile from text to JSON: { "fullName": "", "email": "", "skills": "", "projects": "", "internships": "", "education": "", "school12th": "", "school10th": "" }.\nText: ${text}`;
    const responseText = await generateWithFallback('gemini-3-flash-preview', prompt, { responseMimeType: "application/json" });
    return JSON.parse(extractJson(responseText));
};

export const generateTargetedResume = async (data: UserInput, role: string): Promise<string> => {
    const systemInstruction = `You are a professional resume writer. Rewrite the provided resume content specifically for a ${role} position. 
    Use strong action verbs, quantify achievements where possible, and ensure a clean Markdown format with headers (###).
    Avoid generic phrases. Focus on impact.`;
    
    const prompt = `
    Candidate: ${data.fullName}
    Target Role: ${role}
    Original Resume Content (Context):
    Skills: ${data.skills}
    Experience: ${data.internships}
    Projects: ${data.projectsList ? JSON.stringify(data.projectsList) : data.projects}
    Education: ${data.education}
    `;

    return await generateWithFallback('gemini-3-flash-preview', prompt, { 
        temperature: 0.3,
        systemInstruction 
    });
};

export const fetchCompanyInsights = async (company: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze ${company} for a job applicant. 
  Provide a concise summary including:
  1. Mission Statement
  2. Core Values
  3. 2-3 Recent Key News Headlines (from late 2024-2025)
  
  Format clearly with bold headers.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "No insights found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
        .map((c: any) => c.web?.uri)
        .filter((u: string) => typeof u === 'string' && u.length > 0);
    
    const uniqueSources = Array.from(new Set(sources));

    return { text, sources: uniqueSources as string[] };
  } catch (error) {
    console.error("Company Insight Error:", error);
    return { text: "Unable to fetch company insights at this time.", sources: [] };
  }
};