import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis } from '../types';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    resume: { type: Type.STRING, description: "A clean, ATS-friendly, one-page resume text." },
    coverLetter: { type: Type.STRING, description: "A formal 3-paragraph business cover letter with header." },
    linkedin: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "A professional, high-impact LinkedIn headline." },
        alternativeHeadlines: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "5 alternative, keyword-optimized headlines (e.g. one for creative, one for analytical, one for leadership)." 
        },
        bio: { type: Type.STRING, description: "A compelling 'About Me' narrative (150-200 words)." },
      },
    },
    coldEmail: { type: Type.STRING, description: "A short, punchy cold email to a recruiter/founder (subject + body)." },
    salaryNegotiation: { type: Type.STRING, description: "A professional script to negotiate salary after receiving an offer." },
    mockInterview: {
      type: Type.OBJECT,
      properties: {
        intro: { type: Type.STRING, description: "Context for the interview simulation." },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              feedback: { type: Type.STRING, description: "Brief tip on how to answer this specific question." },
            },
          },
        },
        outro: { type: Type.STRING, description: "Closing encouragement." },
      },
    },
    careerRoadmap: {
      type: Type.ARRAY,
      description: "A chronological career progression plan.",
      items: {
        type: Type.OBJECT,
        properties: {
            phase: { type: Type.STRING, description: "e.g., 'Phase 1', 'Month 1-3'" },
            duration: { type: Type.STRING, description: "Time period required e.g., '3 Months'" },
            title: { type: Type.STRING, description: "Main focus area e.g., 'Foundations & Core Logic'" },
            description: { type: Type.STRING, description: "Specific actionable goals." },
            tools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 specific tools/tech to master." }
        }
      }
    },
  },
};

const roadmapSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
        phase: { type: Type.STRING },
        duration: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  }
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "ATS Score 0-100." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    jobFitPrediction: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
  },
};

const profileImportSchema = {
  type: Type.OBJECT,
  properties: {
    fullName: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    linkedinGithub: { type: Type.STRING },
    careerObjective: { type: Type.STRING },
    education: { type: Type.STRING },
    skills: { type: Type.STRING },
    projects: { type: Type.STRING },
    internships: { type: Type.STRING },
    certifications: { type: Type.STRING },
    interests: { type: Type.STRING },
  }
};

const extractJson = (text: string): string => {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  
  // Try finding array if object not found (for roadmap regen)
  if (startIndex === -1) {
     const arrayStart = text.indexOf('[');
     const arrayEnd = text.lastIndexOf(']');
     if (arrayStart !== -1 && arrayEnd !== -1) {
         return text.substring(arrayStart, arrayEnd + 1);
     }
  }

  if (startIndex === -1 || endIndex === -1) {
    console.warn("JSON Extraction Failed. Raw Text:", text);
    throw new Error("Response did not contain valid JSON.");
  }
  return text.substring(startIndex, endIndex + 1);
};

const getApiKey = (): string | undefined => {
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
    }
  } catch (e) {}
  return undefined;
};

// Helper function to retry with a fallback model if the primary fails
const generateWithFallback = async (
    primaryModel: string, 
    fallbackModel: string, 
    contents: string, 
    config: any
) => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing API Key.");
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: contents,
            config: config,
        });
        return response;
    } catch (error: any) {
        console.warn(`Primary model ${primaryModel} failed.`, error.message);
        
        const isQuotaError = error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('503');

        if (isQuotaError && fallbackModel) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { thinkingConfig, ...fallbackConfig } = config;
            const response = await ai.models.generateContent({
                model: fallbackModel,
                contents: contents,
                config: fallbackConfig,
            });
            return response;
        }
        throw error;
    }
};

export const parseProfileData = async (text: string): Promise<Partial<UserInput>> => {
    const systemInstruction = `Extract career profile info into JSON. Return empty strings if missing.`;
    const config = { responseMimeType: "application/json", responseSchema: profileImportSchema, systemInstruction, temperature: 0.1 };

    try {
      const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", text, config);
      return JSON.parse(extractJson(response.text || "{}"));
    } catch (error) {
      throw new Error("Could not extract data.");
    }
};

export const generateJobToolkit = async (data: UserInput): Promise<JobToolkit> => {
  const systemInstruction = `
    You are "JobHero AI", an elite career strategist.
    
    **RULES**: 
    1. NO hallucination. Use provided details only for Resume/CV.
    2. Professional formatting is non-negotiable.

    --- OUTPUT REQUIREMENTS ---

    1. **Resume**:
       - Standard headers: 📝 SUMMARY, 🎯 OBJECTIVE, 🎓 EDUCATION, 💡 SKILLS, 🚀 PROJECTS, 🏢 EXPERIENCE, 📜 CERTIFICATIONS.
       - Use "➤" bullets.

    2. **Cover Letter**:
       - STRICT Business Letter Format:
         [Date]
         
         [Hiring Manager Name]
         [Hiring Manager Title]
         [Company Name]
         [Company Address]
         
         Dear [Hiring Manager Name or "Hiring Team"],
         [Body Paragraph 1: Hook]
         [Body Paragraph 2: Skills alignment]
         [Body Paragraph 3: Closing]
         
         Sincerely,
         [Name]

    3. **LinkedIn**:
       - Headline: Viral, high-impact, keyword-rich (e.g., "Full Stack Dev | React & Node.js | Building Scalable Apps").
       - Provide 5 alternative headlines in 'alternativeHeadlines' array catering to different vibes (e.g., Professional, Creative, Founder-focused).
       - Bio: First-person professional narrative. Engaging, authoritative, welcoming.

    4. **Career Roadmap**:
       - Generate a detailed, chronological flowchart array (4-6 steps) to master the role in 2025.
       - For each step, strictly provide:
         - **Phase**: e.g. "Phase 1"
         - **Duration**: Specific time period (e.g. "Weeks 1-6")
         - **Title**: Milestone name
         - **Description**: Actionable goals
         - **Tools**: Specific, trending modern tools (e.g. "Next.js 14", "Docker", "Supabase", "Kubernetes").

    5. **Cold Email**:
       - Subject line + Short body (max 100 words) to send to a founder/recruiter asking for an opportunity.

    6. **Salary Negotiation Script**:
       - Professional script to counter-offer a salary proposal politely but firmly.

    Return JSON.
  `;

  const userContent = `
    User Details:
    Name: ${data.fullName} | Role: ${data.jobRoleTarget} | Company: ${data.company}
    Skills: ${data.skills} | Exp: ${data.internships} | Years of Experience: ${data.yearsOfExperience} | Projects: ${data.projects}
    Edu: ${data.education} | Bio: ${data.careerObjective}
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.3,
    systemInstruction: systemInstruction,
  };
  
  try {
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
    return JSON.parse(extractJson(response.text || "{}")) as JobToolkit;
  } catch (error: any) {
    throw new Error("AI Generation failed: " + error.message);
  }
};

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinkingModel: boolean = false): Promise<JobToolkit['careerRoadmap']> => {
  const primaryModel = useThinkingModel ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  
  const systemInstruction = `
    Act as a Senior Technical Career Coach.
    Create a comprehensive, step-by-step career roadmap to become a "${newRole}" in 2025.
    
    Structure the response as a chronological flowchart array (4-6 steps).
    For each step, strictly provide:
    1. **Phase**: e.g., "Phase 1: Foundations", "Phase 2: Advanced Concepts".
    2. **Duration**: Realistic time period (e.g., "Weeks 1-6").
    3. **Title**: Clear milestone name.
    4. **Description**: Actionable learning objectives.
    5. **Tools**: A specific list of modern, trending tools/technologies to learn (e.g., "Next.js 14", "Supabase", "Tailwind").
  `;

  const userContent = `User Education: ${data.education}. Current Skills: ${data.skills}. Years of Experience: ${data.yearsOfExperience}. Target: ${newRole}`;

  const config: any = {
      responseMimeType: "application/json",
      responseSchema: roadmapSchema, // Expecting Array
      systemInstruction: systemInstruction,
  };

  if (useThinkingModel) config.thinkingConfig = { thinkingBudget: 16000 }; 

  try {
    const response = await generateWithFallback(primaryModel, "gemini-3-flash-preview", userContent, config);
    const jsonText = extractJson(response.text || "[]");
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error("Failed to regenerate roadmap.");
  }
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
  const systemInstruction = `
    Act as a strict ATS algorithm.
    Analyze the resume for the role: "${jobRole}".
    Return JSON with score, strengths, improvements, missingKeywords, jobFitPrediction.
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: analysisSchema,
    systemInstruction: systemInstruction,
    temperature: 0.1,
  };

  try {
    // Use flash-preview as it follows JSON schema better than lite
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-3-flash-preview", resumeText, config);
    return JSON.parse(extractJson(response.text || "{}")) as ResumeAnalysis;
  } catch (error) {
    console.error("Analysis Error", error);
    throw new Error("Resume analysis failed.");
  }
};