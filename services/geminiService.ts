import { GoogleGenAI } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis, InterviewFeedback, RoadmapStep } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = "gemini-3-flash-preview";

// Helper to call Gemini with JSON response
async function callGeminiJSON<T>(prompt: string): Promise<T> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      // Fallback for markdown wrapped JSON
      const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      if (match && match[1]) return JSON.parse(match[1]) as T;
      throw e;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export const generateJobToolkit = async (input: UserInput): Promise<JobToolkit> => {
  const prompt = `
    You are an expert career coach and professional resume writer.
    
    USER PROFILE:
    ${JSON.stringify(input, null, 2)}
    
    TARGET OBJECTIVE:
    Role: ${input.jobRoleTarget}
    Company: ${input.company}
    Motivation: ${input.whyThisRole}
    
    STRATEGY:
    1. FIRST, analyze the target role and company culture/requirements internally.
    2. THEN, generate the toolkit content specifically tailored to this target.
    3. RESUME OPTIMIZATION:
       - Rewrite experience bullet points to highlight achievements relevant to ${input.jobRoleTarget}.
       - Integrate high-impact keywords for ATS optimization for this specific role.
       - Align the professional summary with ${input.company}'s values.
    4. INTERVIEW PREP:
       - Generate exactly 10 interview questions.
       - Include a mix of:
         * Technical/Skill-based questions relevant to the role.
         * Behavioral/Personality questions (culture fit).
         * Situational questions (problem-solving).
       - Tailor questions to the specific company if known.

    CRITICAL RULES:
    - STRICTLY use the provided user profile data. Do NOT invent, hallucinate, or add any experiences, skills, or achievements that are not explicitly present in the input.
    - You may rephrase, format, and professionalize the existing content, but factual accuracy must be maintained 100%.
    - If a section (like experience) is empty in the input, leave it empty or minimal in the output; do not make up placeholder data.

    Return strict JSON matching this structure exactly:
    {
      "resume": "Full professional resume text formatted with sections (Summary, Experience, Education, Skills, Projects). Use plain text with clear headings.",
      "coverLetter": "Full professional cover letter text.",
      "linkedin": {
        "headlines": ["Headline Option 1", "Headline Option 2", "Headline Option 3"],
        "bio": "Engaging professional bio for LinkedIn."
      },
      "mockInterview": {
        "questions": [
          { 
            "question": "Interview question", 
            "context": "Why this is asked (e.g., Technical, Behavioral)", 
            "feedback": "Key talking points and strategy" 
          }
        ]
      },
      "careerRoadmap": [
        { 
          "phase": "Phase 1", 
          "duration": "Month 1-3", 
          "title": "Step Title", 
          "description": "Description of this step", 
          "tools": ["Tool 1", "Tool 2"], 
          "milestones": ["Milestone 1"], 
          "resources": [{ "title": "Resource Name", "type": "Course" }] 
        }
      ]
    }
  `;
  return callGeminiJSON<JobToolkit>(prompt);
};

export const parseProfileData = async (text: string): Promise<Partial<UserInput>> => {
  const prompt = `
    Extract career profile data from this text:
    "${text}"
    
    Return JSON compatible with UserInput structure (fullName, email, skills, experience, etc.).
  `;
  return callGeminiJSON<Partial<UserInput>>(prompt);
};

export const fetchCompanyInsights = async (companyName: string): Promise<{ text: string, sources: string[] }> => {
  const prompt = `
    Provide key insights for the company: ${companyName}.
    Return JSON with:
    {
      "text": "Mission, Recent News, Culture, Interview Tips...",
      "sources": ["url1", "url2"]
    }
  `;
  return callGeminiJSON<{ text: string, sources: string[] }>(prompt);
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
  const prompt = `
    Analyze this resume for the role of ${jobRole}:
    "${resumeText}"
    
    Return JSON matching ResumeAnalysis interface:
    { 
      "score": number (0-100), 
      "summary": "Overall feedback summary", 
      "strengths": ["Strength 1", "Strength 2"], 
      "improvements": ["Improvement 1", "Improvement 2"],
      "missingKeywords": [
        { "keyword": "Keyword", "context": "Context", "reason": "Why it matters", "integrationTip": "How to add it" }
      ]
    }
  `;
  return callGeminiJSON<ResumeAnalysis>(prompt);
};

export const generateEliteTools = async (input: UserInput): Promise<Partial<JobToolkit>> => {
  const prompt = `
    Generate elite career tools for:
    ${JSON.stringify(input)}
    
    Return JSON with:
    {
      "recruiterPsychology": "Insights on how recruiters view this profile...",
      "salaryNegotiation": "Script for negotiating salary..."
    }
  `;
  return callGeminiJSON<Partial<JobToolkit>>(prompt);
};

export const analyzeInterviewAnswer = async (question: string, answer: string, jobRole: string, company: string): Promise<InterviewFeedback> => {
  const prompt = `
    Role: ${jobRole}
    Company: ${company}
    Question: ${question}
    Candidate Answer: ${answer}
    
    Analyze the answer. Return JSON matching InterviewFeedback interface:
    { 
      "rating": number (1-10), 
      "clarity": "Feedback on clarity", 
      "relevance": "Feedback on relevance", 
      "missingPoints": ["Point 1", "Point 2"], 
      "sampleAnswer": "An ideal answer example" 
    }
  `;
  return callGeminiJSON<InterviewFeedback>(prompt);
};

export const regenerateCareerRoadmap = async (input: UserInput, role: string, isRegeneration: boolean): Promise<{ careerRoadmap: RoadmapStep[] }> => {
  const prompt = `
    You are an elite career strategist. Create a high-impact, step-by-step career roadmap for the role of "${role}" based on this profile:
    ${JSON.stringify(input)}
    
    STRATEGY:
    1.  **Gap Analysis:** Identify the gap between the user's current profile and the target role.
    2.  **Phased Approach:** Break down the journey into logical phases (e.g., Foundation, Skill Acquisition, Project Portfolio, Networking & Application).
    3.  **Actionable Milestones:** For each phase, provide concrete, verifiable milestones (e.g., "Build X project," "Get Y certification").
    4.  **Resource Curation:** Recommend specific, high-quality resources (courses, books, tools).
    5.  **Premium Suggestions:** Explicitly suggest "Premium" or "Elite" actions/resources (e.g., "Hire a mentor," "Join exclusive community X," "Attend conference Y") that would accelerate their progress significantly. Label these clearly.
    6.  **Clarification (If needed):** If the target role is too broad (e.g., "Manager"), include a step asking the user to define their niche (e.g., "Product Manager" vs. "Engineering Manager") to refine the strategy.

    Return JSON with:
    {
      "careerRoadmap": [
        { 
          "phase": "Phase 1: Foundation", 
          "duration": "Month 1-2", 
          "title": "Solidify Core Competencies", 
          "description": "Focus on closing immediate skill gaps...", 
          "tools": ["Tool A", "Tool B"], 
          "milestones": ["Complete Course X", "Build Project Y"], 
          "resources": [
            { "title": "Free: Course Name", "type": "Course" },
            { "title": "Premium: Exclusive Bootcamp/Mentorship", "type": "Premium" }
          ] 
        }
      ]
    }
  `;
  return callGeminiJSON<{ careerRoadmap: RoadmapStep[] }>(prompt);
};

