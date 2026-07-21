'use client';

import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, Sparkles, FileText, Linkedin, Mail, X, LogOut, 
  Loader2, AlertCircle, CheckCircle2, TrendingUp, ChevronDown, 
  ChevronUp, AlertTriangle, Download, BookOpen, Send, RefreshCw, 
  Sliders, Eye, Layers, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type GeneratedContent = {
  resume: string;
  linkedinKit: string;
  coldEmail: string;
  interviewPrep: string;
  atsAnalysis?: string;
};

interface InterviewQuestion {
  qNumber: string;
  category: string;
  question: string;
  approach: string;
}

// 1. Presets / Student Profiles
const PRESET_MERN = {
  input: "Rahul Sharma, B.Tech CSE, 4th Year, CGPA 8.4 at AKTU. Made a full-stack e-commerce store using React, Node.js, Express, and MongoDB. Used Tailwind CSS for responsive styling and JWT for user auth. Have a Google Cloud Cloud Digital Leader certification. Looking for a Frontend Developer or SDE Intern role at a fast-growing tech startup. Know JavaScript, HTML/CSS, Python, and SQL.",
  company: "Fast-growing Tech Startup",
  role: "Software Development Engineer (SDE) Intern",
  jd: "We are looking for a Software Developer Intern who is passionate about React and Node.js. You will build user-friendly interfaces, integrate RESTful APIs, and write clean, scalable code. Knowledge of modern styling libraries like Tailwind CSS is highly preferred. Experience with SQL/NoSQL databases is a plus."
};

const PRESET_AI_ML = {
  input: "Ananya Gupta, B.Tech CSE (AI/ML), 3rd Year at SRM IST, CGPA 9.1. Developed a brain tumor detection model using PyTorch and Convolutional Neural Networks (CNNs) with 94% accuracy. Built an interactive web dashboard in Streamlit to upload MRI scans and show results. Know Python, OpenCV, Pandas, NumPy, and TensorFlow. Seeking an ML Engineer Intern role at a medical AI startup.",
  company: "NVIDIA or any Healthcare AI Startup",
  role: "Machine Learning Engineer Intern",
  jd: "We are seeking an ML Intern with strong hands-on Python and deep learning skills. You will develop, optimize, and deploy neural network models (preferably PyTorch/TensorFlow) for computer vision tasks. Experience with Streamlit, pandas, and data processing is required. Must be comfortable structuring raw datasets and explaining model predictions."
};

const PRESET_JAVA = {
  input: "Dev Kumar, B.Tech Information Technology, 3rd Year at VIT Vellore, CGPA 7.9. Good grasp of Object-Oriented Programming (OOP) in Java. Created a library management system desktop application in Java with MySQL database backend to manage books and memberships. Know Java, SQL, JDBC, HTML, and Python. Want a placement at Infosys, TCS, or any enterprise service provider.",
  company: "Infosys / TCS",
  role: "Systems Engineer / Graduate Trainee",
  jd: "Looking for entry-level Systems Engineers. Requirements: solid understanding of Object-Oriented Programming in Java or C++, hands-on experience writing relational SQL queries, databases, and general troubleshooting skills. Strong communication and ability to work in agile teams."
};

const formatMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-300">$1</em>')
    .replace(/^---$/gim, '<hr class="my-6 border-white/10" />')
    .replace(/^[\*\-] (.*$)/gim, '<div class="flex gap-2 mb-1.5"><span class="text-green-500 shrink-0">•</span><span>$1</span></div>');
};

const extractCandidateName = (resumeContent: string): string => {
  if (!resumeContent) return "Candidate";
  const lines = resumeContent.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const cleaned = line.replace(/^[#\-\s\*=\[\]]+/g, '').trim();
    if (cleaned && cleaned.length < 40 && !cleaned.includes('SECTION') && !cleaned.includes('RESUME') && !cleaned.includes('ATSCV') && !cleaned.includes('OBJECTIVE')) {
      return cleaned;
    }
  }
  return "Candidate";
};

const parseColdEmail = (rawText: string) => {
  if (!rawText) return { subject: 'Application for Role', body: '' };
  const subjectMatch = rawText.match(/Subject:\s*([^\n]+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : 'Application for Opportunities';
  const body = rawText.replace(/Subject:\s*[^\n]+/i, '').trim();
  return { subject, body };
};

function parseInterviewPrep(text: string): InterviewQuestion[] {
  if (!text) return [];
  try {
    const questions: InterviewQuestion[] = [];
    const blocks = text.split(/(?=Q\d\s*\[)/i);
    for (const block of blocks) {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) continue;
      
      const qMatch = trimmedBlock.match(/Q(\d)\s*\[(.*?)\]:\s*([^\n]+)/i);
      if (qMatch) {
        const qNumber = qMatch[1];
        const category = qMatch[2];
        const question = qMatch[3].trim();
        
        const approachIndex = trimmedBlock.indexOf('→');
        let approach = '';
        if (approachIndex !== -1) {
          approach = trimmedBlock.substring(approachIndex).replace(/^→\s*(How to approach it:)?/i, '').trim();
        } else {
          const lines = trimmedBlock.split('\n');
          const approachLine = lines.find(l => l.includes('approach'));
          if (approachLine) {
            approach = approachLine.replace(/^.*approach( it)?:/i, '').trim();
          }
        }
        
        questions.push({
          qNumber,
          category,
          question,
          approach: approach || "Structure your thoughts around the core technologies and project metrics you highlighted."
        });
      }
    }
    return questions;
  } catch (err) {
    console.error("Failed to parse interview prep:", err);
    return [];
  }
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  const [input, setInput] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);

  // Workspace-specific states
  const [activeTab, setActiveTab] = useState<string>('resume');
  const [resumeFont, setResumeFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [resumeTheme, setResumeTheme] = useState<'light' | 'dark'>('light');
  const [completedRecommendations, setCompletedRecommendations] = useState<Record<string, boolean>>({});
  const [studiedQuestions, setStudiedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
        } else {
          setUser(session.user);
        }
      } catch (err) {
        router.push('/login');
      }
      setIsInitializing(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.push('/login');
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    router.push('/login');
  };

  const handleApplyPreset = (preset: typeof PRESET_MERN) => {
    setInput(preset.input);
    setTargetCompany(preset.company);
    setTargetRole(preset.role);
    setJobDescription(preset.jd);
  };

  const handleGenerate = async () => {
    const sanitizedInput = input.trim();
    if (!sanitizedInput) {
      setError("Tell us about yourself first");
      return;
    }

    if (sanitizedInput.length > 3000) {
      setError("Input is too long. Please limit to 3000 characters.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setContent(null);
    setCompletedRecommendations({});
    setStudiedQuestions({});

    try {
      let res;
      try {
        res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: sanitizedInput,
            targetCompany,
            targetRole,
            jobDescription
          }),
        });
      } catch (networkError) {
        throw new Error('Network error: Unable to reach the server. Please check your internet connection.');
      }

      if (!res.ok) {
        let errorMsg = 'Failed to generate kit due to a server error.';
        if (res.status >= 500) {
          errorMsg = 'Server is currently experiencing issues. Please try again later.';
        } else if (res.status === 401) {
          errorMsg = 'Session expired. Please sign in again.';
        }
        
        try {
          const errorData = await res.json();
          if (errorData.error === 'limit_reached') {
            setShowPaywall(true);
            setIsGenerating(false);
            return;
          }
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {}
        throw new Error(errorMsg);
      }

      const { text } = await res.json();
      
      let resume = '', linkedinKit = '', coldEmail = '', interviewPrep = '', atsAnalysis = '';

      const resumeMatch = text.match(/SECTION 1.*?RESUME([\s\S]*?)(?=SECTION 2|$)/i);
      const linkedinHeadlinesMatch = text.match(/SECTION 2.*?LINKEDIN HEADLINES([\s\S]*?)(?=SECTION 3|$)/i);
      const linkedinAboutMatch = text.match(/SECTION 3.*?LINKEDIN ABOUT([\s\S]*?)(?=SECTION 4|$)/i);
      const coldEmailMatch = text.match(/SECTION 4.*?EMAIL([\s\S]*?)(?=SECTION 5|$)/i);
      const interviewMatch = text.match(/SECTION 5.*?INTERVIEW([\s\S]*?)(?=SECTION 6|$)/i);
      const atsMatch = text.match(/SECTION 6.*?ATS MATCH ANALYSIS([\s\S]*?)(?=$)/i);

      if (resumeMatch) resume = resumeMatch[1].trim();
      
      if (linkedinHeadlinesMatch || linkedinAboutMatch) {
         linkedinKit = [
           linkedinHeadlinesMatch ? linkedinHeadlinesMatch[1].trim() : '', 
           linkedinAboutMatch ? linkedinAboutMatch[1].trim() : ''
         ].filter(Boolean).join('\n\n');
      }

      if (coldEmailMatch) coldEmail = coldEmailMatch[1].trim();
      if (interviewMatch) interviewPrep = interviewMatch[1].trim();
      if (atsMatch) atsAnalysis = atsMatch[1].trim();

      // Fallback for old formatting if needed
      if (!resume && !linkedinKit && !coldEmail && !interviewPrep) {
        const sections = text.split('===');
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i].trim();
          if (section.startsWith('ATS_RESUME')) resume = section.replace('ATS_RESUME===', '').replace('ATS_RESUME', '').trim();
          else if (section.startsWith('LINKEDIN_KIT')) linkedinKit = section.replace('LINKEDIN_KIT===', '').replace('LINKEDIN_KIT', '').trim();
          else if (section.startsWith('COLD_EMAIL')) coldEmail = section.replace('COLD_EMAIL===', '').replace('COLD_EMAIL', '').trim();
          else if (section.startsWith('INTERVIEW_PREP')) interviewPrep = section.replace('INTERVIEW_PREP===', '').replace('INTERVIEW_PREP', '').trim();
        }

        if (!resume && !linkedinKit && !coldEmail && !interviewPrep) {
           const parts = text.split(/ATS_RESUME|LINKEDIN_KIT|COLD_EMAIL|INTERVIEW_PREP/i);
           if (parts.length >= 5) {
              resume = parts[1].replace(/^===|===$/g, '').trim();
              linkedinKit = parts[2].replace(/^===|===$/g, '').trim();
              coldEmail = parts[3].replace(/^===|===$/g, '').trim();
              interviewPrep = parts[4].replace(/^===|===$/g, '').trim();
           } else {
              resume = text;
           }
        }
      }

      const freshContent = {
        resume: resume.replace(/^===/,'').trim(),
        linkedinKit: linkedinKit.replace(/^===/,'').trim(),
        coldEmail: coldEmail.replace(/^===/,'').trim(),
        interviewPrep: interviewPrep.replace(/^===/,'').trim(),
        atsAnalysis: atsAnalysis.replace(/^===/,'').trim() || undefined,
      };

      setContent(freshContent);
      
      // Auto-set optimal starting tab
      if (freshContent.atsAnalysis && freshContent.atsAnalysis.length > 10) {
        setActiveTab('ats-audit');
      } else {
        setActiveTab('resume');
      }

    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate placement kit. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      let orderRes;
      try {
        orderRes = await fetch('/api/payment/create-order', { method: 'POST' });
      } catch (networkError) {
        throw new Error('Network error: Unable to connect to the payment server. Please check your connection.');
      }

      if (!orderRes.ok) {
        let errorMsg = 'Failed to initiate checkout due to a server configuration issue.';
        try {
           const errorData = await orderRes.json();
           errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
      const { orderId } = await orderRes.json();

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: 19900,
          currency: 'INR',
          name: 'AtlasCV',
          description: 'Pro Plan - Unlimited Generations',
          order_id: orderId,
          theme: { color: '#22c55e' },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  setShowPaywall(false);
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 3000);
                  
                  if (input.trim()) {
                    handleGenerate();
                  }
                } else {
                  alert(verifyData.error || 'Payment verification failed. Please contact support.');
                }
              } else {
                alert('Server failed to verify payment. Please contact support with your payment ID.');
              }
            } catch (networkError) {
              alert('Network error during verification. We will automatically re-verify your payment soon.');
            }
          },
          prefill: {
            email: user?.email || '',
          },
          modal: {
            ondismiss: function () {
              console.log('Payment dismissed');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      };
      
      script.onerror = () => {
        alert('Failed to load Razorpay checkout script. Please check your network connection or disable adblockers.');
      };
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Failed to initiate checkout. Please try again.');
    }
  };

  const handleDownloadTxt = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  const candidateName = content ? extractCandidateName(content.resume) : "Candidate";

  return (
    <div className="min-h-screen flex flex-col selection:bg-green-500/30 bg-[#070708] text-gray-200">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Sparkles className="w-4 h-4 text-green-500" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight text-white bg-gradient-to-r from-white via-gray-200 to-green-400 bg-clip-text text-transparent">AtlasCV</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 border border-green-500/20 text-green-500 font-mono">v1.2</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-all border border-white/5 hover:border-white/10 rounded-full bg-white/[0.02] hover:bg-white/[0.05]"
          >
            <Info className="w-3.5 h-3.5 text-green-500" /> About
          </button>
          <span className="text-gray-400 text-xs font-mono hidden md:inline-block">
            {user?.email}
          </span>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-all border border-white/5 hover:border-white/10 rounded-full bg-white/[0.02] hover:bg-white/[0.05]"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Layout Wrapper */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col relative z-10">
        
        {/* Dynamic Title / Greeting state */}
        <AnimatePresence mode="wait">
          {!content ? (
            <motion.div 
              key="hero-block"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mt-6 mb-10 space-y-3"
            >
              <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Build Your Professional <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Placement Kit</span><br className="hidden sm:inline" />
                In One Click
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                We generate an ATS-Optimized Resume, tailored LinkedIn headline alternatives, email outreach copy, and a fully custom Interview Q&A guide from a simple unstructured text dump.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard-greeting"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 md:p-6 bg-[#0f0f13] border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500 text-black uppercase tracking-wider font-mono">WORKSPACE</span>
                  <h2 className="text-xl md:text-2xl font-heading font-bold text-white">
                    {candidateName}&apos;s Placement Kit
                  </h2>
                </div>
                <p className="text-xs text-gray-400">
                  Targeting <strong className="text-gray-300">{targetRole || "Software Developer"}</strong> {targetCompany ? `at ${targetCompany}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setContent(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/5 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Edit Raw Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace Panels (Grid) */}
        <div className={`grid grid-cols-1 ${content ? 'lg:grid-cols-12' : 'max-w-3xl w-full mx-auto'} gap-8 items-start`}>
          
          {/* Input Panel (Col-span 4 or Full centered) */}
          <div className={`${content ? 'lg:col-span-4' : 'w-full'} space-y-6 z-20`}>
            
            {/* Input Card */}
            <div className={`bg-[#0f0f12] border border-white/5 rounded-2xl shadow-xl overflow-hidden ${content ? 'opacity-90 hover:opacity-100 transition-opacity p-5' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-green-500" />
                  {content ? 'Refine Parameters' : 'Career Details Dump'}
                </label>
                {!content && (
                  <span className="text-xs text-gray-500 font-mono">1-click samples:</span>
                )}
              </div>

              {/* Presets - Only show when form is fresh or if they want to load them */}
              {!content && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(PRESET_MERN)}
                    className="p-2.5 text-left rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs transition-all flex flex-col justify-between h-20"
                  >
                    <span className="font-bold text-green-400 flex items-center gap-1">🚀 MERN Dev</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Final year student with e-commerce projects</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(PRESET_AI_ML)}
                    className="p-2.5 text-left rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs transition-all flex flex-col justify-between h-20"
                  >
                    <span className="font-bold text-emerald-400 flex items-center gap-1">🧠 AI/ML Intern</span>
                    <span className="text-[10px] text-gray-500 leading-tight">3rd Year student, brain scan ML dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(PRESET_JAVA)}
                    className="p-2.5 text-left rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs transition-all flex flex-col justify-between h-20"
                  >
                    <span className="font-bold text-teal-400 flex items-center gap-1">⚙️ Java & SQL</span>
                    <span className="text-[10px] text-gray-500 leading-tight">VIT Junior aiming for Infosys/TCS placements</span>
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <textarea
                    id="details"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your credentials like a rough draft or WhatsApp message:&#10;&#10;e.g. Rahul Sharma, BTech IT 4th year from AKTU. CGPA 8.1. Built a React library portal. Know Python, JavaScript. Looking for SDE intern at TCS..."
                    className={`w-full bg-black/30 border border-white/5 rounded-xl p-4 text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:border-green-500/50 text-sm transition-all ${content ? 'h-36' : 'h-52'}`}
                    maxLength={3000}
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500 font-mono">
                    <span>No structured forms needed</span>
                    <span>{input.length}/3000 characters</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Company (Optional)</label>
                    <input 
                      type="text"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      placeholder="e.g. Infosys, Swiggy, Zoho"
                      className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Role (Optional)</label>
                    <input 
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. SDE Intern, ML Junior"
                      className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job Description (Highly Recommended for ATS Audit)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target JD here. We will match keywords and align your profile score..."
                    className="w-full h-20 bg-black/20 border border-white/5 rounded-lg p-3 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${input.trim() && !isGenerating && !content ? 'shadow-lg shadow-green-600/15 border border-green-400/20' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{content ? 'Regenerate Entire Kit' : 'Generate Placement Kit'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2 items-start shadow-md">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Preparation checklist summary - Only show when content is loaded */}
            {content && (
              <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-500" />
                  <span>Your Action Plan</span>
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                    <span className="text-gray-400">Kit Progress</span>
                    <span className="font-mono text-green-500">
                      {Math.round(
                        ((Object.keys(completedRecommendations).length + Object.keys(studiedQuestions).length) / 9) * 100
                      )}%
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-500">✓</span>
                      <span>ATS Resume generated successfully</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-500">✓</span>
                      <span>LinkedIn branding copy ready</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-500">✓</span>
                      <span>Cold email outreach formatted</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <span className="text-yellow-500">→</span>
                      <span>Next: Study customized Q&A list</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Workspace Output Workspace (Col-span 8) */}
          <div className={`${content ? 'lg:col-span-8' : 'w-full'} space-y-6 z-10`}>
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading-box"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full bg-[#0e0e11] border border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center space-y-6 shadow-2xl h-[500px]"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-green-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-green-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-2 max-w-sm">
                    <h3 className="text-white font-bold text-lg">Assembling Placement Assets</h3>
                    <p className="text-gray-400 text-xs">
                      Formatting resume sections, calculating ATS score weights, writing LinkedIn headlines, and preparing tailored interview guidance...
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <span className="px-2.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/5 text-gray-400 font-mono">Running Security Audit</span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 font-mono">Writing LaTeX Bullet Points</span>
                  </div>
                </motion.div>
              ) : content ? (
                <motion.div 
                  key="workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Workspace Tab Bar */}
                  <div className="bg-[#0f0f13] border border-white/5 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-md">
                    {content.atsAnalysis && (
                      <button
                        onClick={() => setActiveTab('ats-audit')}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${activeTab === 'ats-audit' ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'}`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>ATS Score Audit</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('resume')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${activeTab === 'resume' ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ATS Resume</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('linkedin')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${activeTab === 'linkedin' ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn Profile</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('email')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${activeTab === 'email' ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>HR Cold Email</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('interview')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${activeTab === 'interview' ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Interview Prep</span>
                    </button>
                  </div>

                  {/* Active Tab Screen */}
                  <div className="space-y-6">
                    {/* 1. ATS Score Audit Tab */}
                    {activeTab === 'ats-audit' && content.atsAnalysis && (
                      <AtsAuditScreen 
                        rawContent={content.atsAnalysis} 
                        completedRecommendations={completedRecommendations}
                        toggleRecommendation={(idx) => {
                          setCompletedRecommendations(prev => ({
                            ...prev,
                            [idx]: !prev[idx]
                          }));
                        }}
                      />
                    )}

                    {/* 2. Resume Tab */}
                    {activeTab === 'resume' && (
                      <ResumeScreen 
                        content={content.resume}
                        resumeFont={resumeFont}
                        setResumeFont={setResumeFont}
                        resumeTheme={resumeTheme}
                        setResumeTheme={setResumeTheme}
                        handleCopy={() => {
                          navigator.clipboard.writeText(content.resume);
                        }}
                        handleDownload={() => {
                          handleDownloadTxt(`${candidateName.replace(/\s+/g, '_')}_Resume`, content.resume);
                        }}
                      />
                    )}

                    {/* 3. LinkedIn Kit Tab */}
                    {activeTab === 'linkedin' && (
                      <LinkedInScreen 
                        rawContent={content.linkedinKit} 
                        handleDownload={() => {
                          handleDownloadTxt(`${candidateName.replace(/\s+/g, '_')}_LinkedIn_Kit`, content.linkedinKit);
                        }}
                      />
                    )}

                    {/* 4. HR Email Tab */}
                    {activeTab === 'email' && (
                      <EmailScreen 
                        rawContent={content.coldEmail} 
                        targetCompany={targetCompany}
                        handleDownload={() => {
                          handleDownloadTxt(`${candidateName.replace(/\s+/g, '_')}_Cold_Email`, content.coldEmail);
                        }}
                      />
                    )}

                    {/* 5. Interview Prep Tab */}
                    {activeTab === 'interview' && (
                      <InterviewScreen 
                        rawContent={content.interviewPrep} 
                        studiedQuestions={studiedQuestions}
                        toggleStudied={(idx) => {
                          setStudiedQuestions(prev => ({
                            ...prev,
                            [idx]: !prev[idx]
                          }));
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty-state"
                  className="bg-[#0f0f13]/40 border border-white/5 rounded-2xl p-12 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-gray-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-bold">Workspace Empty</h3>
                    <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                      Enter your academic credentials, internships, and target job parameters above or try our curated 1-click presets to generate your workspace dashboard instantly.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* In-page About Section (Visible only when no content is generated yet) */}
        {!content && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16 border-t border-white/5 pt-12 max-w-4xl mx-auto w-full space-y-12"
          >
            <div className="text-center space-y-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 font-mono tracking-wider uppercase">
                About AtlasCV
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white tracking-tight">
                Empowering India&apos;s Next Engineering Tier
              </h2>
              <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
                AtlasCV is built to bridge the guidance gap for tier-2/3 college graduates. By transforming basic lists of projects and skills into high-impact, professionally structured placement kits, we ensure every student stands a real chance at top-tier roles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">ATS Keyword Alignment</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Our calibration engine scans target job descriptions and extracts critical technical terms, languages, and tools. It highlights matched keywords and calls out missing qualifiers directly on your custom checklist.
                </p>
              </div>

              <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Impact-Driven LaTeX Resumes</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We rewrite simple project logs into powerful, metrics-driven bullet points inspired by top-tier business schools. Clean, single-column plain text layouts guarantee flawless parsing by scanner parsers.
                </p>
              </div>

              <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
                  <Linkedin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Tailored LinkedIn Branding</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Avoid standard generic headings. Get 5 highly customized options corresponding to different personal branding angles—from performance-focused to project-driven styles—plus a natural first-person &quot;About&quot; section.
                </p>
              </div>

              <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Strategic Outreach Email</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Get cold email scripts pre-addressed to HR personnel. These are formatted to showcase your technical value proposition within seconds, increasing recruiter response rates for off-campus positions.
                </p>
              </div>
            </div>

            {/* Quick Process Roadmap */}
            <div className="bg-[#0a0a0d] border border-white/5 p-8 rounded-2xl text-center space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">How to use AtlasCV in 3 steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-xs font-bold flex items-center justify-center mx-auto">1</div>
                  <h4 className="text-xs font-bold text-white">Paste details raw</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Type your projects, skills, or rough resume in plain conversational text. No formatting needed.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-xs font-bold flex items-center justify-center mx-auto">2</div>
                  <h4 className="text-xs font-bold text-white">Define role & company</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Input your target job profile, optional company name, and job description for optimized ATS scoring.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-xs font-bold flex items-center justify-center mx-auto">3</div>
                  <h4 className="text-xs font-bold text-white">Refine & Prepare</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Use our checklists, font settings, and Q&A guides to finalize your outreach. Download clean drafts easily.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/5 mt-auto bg-[#0a0a0c]/80 text-gray-500 text-xs font-mono">
        <p>AtlasCV · Dedicated placement acceleration for India&apos;s next engineering tier</p>
      </footer>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[420px] bg-[#111115] border border-white/10 rounded-2xl p-8 flex flex-col items-center shadow-2xl"
            >
              <button 
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mb-5 border border-green-500/20">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>

              <h2 className="text-white font-extrabold text-2xl text-center mb-1">
                Pro Limit Reached
              </h2>
              
              <p className="text-gray-400 text-xs text-center mb-6 leading-relaxed">
                You&apos;ve used your standard free generations. Upgrade to Pro for unlimited optimization credits, custom resumes, and full email outreach tracking.
              </p>

              <div className="flex items-baseline gap-1 mb-6 bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/10">
                <span className="text-green-400 text-3xl font-extrabold">₹199</span>
                <span className="text-gray-500 text-xs">/month</span>
              </div>

              <ul className="w-full space-y-3 mb-6 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                {[
                  'Unlimited AI-powered generations',
                  'High-accuracy keyword integrations',
                  'Unrestricted Resume, LinkedIn & HR drafts',
                  'Cancel at any time with 1-click'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-gray-300 text-xs">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-extrabold py-3.5 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-lg shadow-green-500/10"
              >
                Upgrade Now — ₹199/month
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3.5 rounded-xl shadow-xl font-semibold flex items-center gap-2.5 text-xs uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            Welcome to AtlasCV Pro! Creating your assets...
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[550px] bg-[#111115] border border-white/10 rounded-2xl p-8 flex flex-col shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setShowAboutModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center border border-green-500/20">
                  <Info className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-white font-extrabold text-xl tracking-tight">
                    About AtlasCV
                  </h2>
                  <p className="text-[10px] text-green-500 font-mono tracking-wider uppercase">PLACEMENT KIT ACCELERATION ENGINE</p>
                </div>
              </div>

              <div className="space-y-5 text-xs text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-white">AtlasCV</strong> is an AI-powered placement preparation suite tailored specifically to democratize off-campus recruitment for engineering students.
                </p>

                <div className="border-t border-b border-white/5 py-4 space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-gray-400">What we generate:</h4>
                  
                  <div className="flex gap-3">
                    <span className="text-green-500 shrink-0 font-bold">✓</span>
                    <div>
                      <strong className="text-white block">ATS-Optimized Resumes</strong>
                      <span className="text-gray-400 text-[11px]">Structured single-column plain text designed to clear automated scanner screens.</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-green-500 shrink-0 font-bold">✓</span>
                    <div>
                      <strong className="text-white block">LinkedIn Branding Alternative Headlines</strong>
                      <span className="text-gray-400 text-[11px]">Various headline options matching your technical expertise and professional personality.</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-green-500 shrink-0 font-bold">✓</span>
                    <div>
                      <strong className="text-white block">Cold Email Outreach Kits</strong>
                      <span className="text-gray-400 text-[11px]">Formatted to directly address HR and recruiters highlighting your project value in seconds.</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-green-500 shrink-0 font-bold">✓</span>
                    <div>
                      <strong className="text-white block">Tailored Q&A Interview Guides</strong>
                      <span className="text-gray-400 text-[11px]">Custom structured technical and behavioral interview preparation points specific to your projects.</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-1">
                  <h4 className="text-white font-bold text-[11px]">The Core Mission</h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Most tier-2 and tier-3 engineering graduates are highly talented but lack structure when presenting their work. AtlasCV converts raw draft-like descriptions into pristine professional copy, aligning them with active market recruiters.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full mt-6 bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-xl transition-colors text-xs uppercase tracking-wider border border-white/5"
              >
                Close Info Panel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SUB-SCREENS FOR EACH DASHBOARD WORKSPACE TAB
// ============================================

// 1. ATS AUDIT PANEL
interface AtsAuditScreenProps {
  rawContent: string;
  completedRecommendations: Record<string, boolean>;
  toggleRecommendation: (idx: string) => void;
}

function AtsAuditScreen({ rawContent, completedRecommendations, toggleRecommendation }: AtsAuditScreenProps) {
  const [showRaw, setShowRaw] = useState(false);
  
  // Parse ATS content
  let matchPercentage = 70;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let technicalSkillsMatch = 75;
  let softSkillsMatch = 65;
  let toolsMatch = 72;
  let recommendations: string[] = [];

  try {
    const matchMatch = rawContent.match(/Match:\s*(\d+)/i);
    if (matchMatch) matchPercentage = parseInt(matchMatch[1], 10);

    const matchedMatch = rawContent.match(/Matched Keywords:\s*([^\n]+)/i);
    if (matchedMatch && matchedMatch[1].trim() !== '[None]' && matchedMatch[1].trim() !== '') {
      matchedKeywords = matchedMatch[1].split(',').map(s => s.trim().replace(/^\[|\]$/g, '').trim()).filter(s => s.toLowerCase() !== 'none' && s.length > 0 && !s.includes('['));
    }

    const missingMatch = rawContent.match(/Missing Keywords:\s*([^\n]+)/i);
    if (missingMatch && missingMatch[1].trim() !== '[None]' && missingMatch[1].trim() !== '') {
      missingKeywords = missingMatch[1].split(',').map(s => s.trim().replace(/^\[|\]$/g, '').trim()).filter(s => s.toLowerCase() !== 'none' && s.length > 0 && !s.includes('['));
    }

    const techMatch = rawContent.match(/Technical Skills Match:\s*(\d+)/i);
    if (techMatch) technicalSkillsMatch = parseInt(techMatch[1], 10);

    const softMatch = rawContent.match(/Soft Skills Match:\s*(\d+)/i);
    if (softMatch) softSkillsMatch = parseInt(softMatch[1], 10);

    const toolsMatchVal = rawContent.match(/Tools & Methodologies Match:\s*(\d+)/i);
    if (toolsMatchVal) toolsMatch = parseInt(toolsMatchVal[1], 10);

    // Extract recommendations
    const lines = rawContent.split('\n');
    let isRecs = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('recommendations:')) {
        isRecs = true;
        continue;
      }
      if (isRecs) {
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const contentStr = trimmed.substring(1).trim().replace(/^\[|\]$/g, '').trim();
          if (contentStr && !contentStr.includes('[Actionable')) {
            recommendations.push(contentStr);
          }
        }
      }
    }
  } catch (err) {
    console.error("ATS audit parser failed", err);
  }

  // Backup recommendations
  if (recommendations.length === 0) {
    if (missingKeywords.length > 0) {
      recommendations.push(`Embed keywords like ${missingKeywords.slice(0, 3).join(', ')} into your Skills list.`);
    }
    recommendations.push("Ensure your work bullet points start with dynamic action verbs.");
    recommendations.push("Quantify your system efficiency with metrics like latency, throughput, or server uptime.");
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', fill: '#22c55e' };
    if (score >= 50) return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', fill: '#eab308' };
    return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', fill: '#ef4444' };
  };

  const scoreInfo = getScoreColor(matchPercentage);
  const totalRecs = recommendations.length;
  const completedRecsCount = Object.keys(completedRecommendations).filter(k => completedRecommendations[k]).length;
  const adjustedScore = Math.min(100, matchPercentage + completedRecsCount * 4);

  return (
    <div className="bg-[#0f0f13] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <h3 className="font-heading font-semibold text-sm text-white">ATS Calibration Analysis</h3>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 hover:text-white transition-colors"
        >
          {showRaw ? 'Show Interactive Audit' : 'Show RAW Report'}
        </button>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {showRaw ? (
            <motion.div 
              key="raw-box"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-pre-wrap font-mono text-xs text-gray-400 leading-relaxed bg-black/30 p-5 rounded-xl border border-white/5"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(rawContent) }}
            />
          ) : (
            <motion.div 
              key="visual-box"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Top Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/[0.01] p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center md:justify-start">
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    {/* SVG Radial Progress */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        className="stroke-white/5 fill-transparent"
                        strokeWidth="7"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        className="fill-transparent transition-all duration-1000 ease-out"
                        strokeWidth="7"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 - (2 * Math.PI * 45 * adjustedScore) / 100}
                        strokeLinecap="round"
                        stroke={scoreInfo.fill}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-heading font-extrabold text-white">{adjustedScore}%</span>
                      <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">ATS Score</span>
                    </div>
                  </div>

                  <div className="text-center sm:text-left space-y-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${scoreInfo.bg} ${scoreInfo.text} ${scoreInfo.border} border`}>
                      {adjustedScore >= 80 ? 'HIGH INTERVIEW CHANCE' : adjustedScore >= 50 ? 'MODERATE FIT' : 'NEEDS OPTIMIZATION'}
                    </span>
                    <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
                      {adjustedScore >= 80 
                        ? 'Your credentials map directly with the role requirements! Ready to send to recruitment.'
                        : 'Almost there! Click checkboxes on the checklist below to see your score calibrate.'}
                    </p>
                  </div>
                </div>

                {/* Subcategory score bars */}
                <div className="space-y-3.5">
                  {[
                    { label: 'Technical Hard Skills Match', val: technicalSkillsMatch },
                    { label: 'Soft Skills & Leadership alignment', val: softSkillsMatch },
                    { label: 'Tools & Methodologies index', val: toolsMatch },
                  ].map((cat, i) => {
                    const barColor = getScoreColor(cat.val);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium font-mono text-gray-400">
                          <span>{cat.label}</span>
                          <span className={barColor.text}>{cat.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${cat.val}%`, backgroundColor: barColor.fill }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Keywords Alignment Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Keywords */}
                <div className="border border-white/5 bg-[#0a0a0d]/50 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Matched Keywords ({matchedKeywords.length})</span>
                  </div>
                  {matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-green-500/5 text-green-400 border border-green-500/10 flex items-center gap-1">
                          <span className="w-1 h-1 bg-green-500 rounded-full" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-600 italic">No direct matching keywords detected.</p>
                  )}
                </div>

                {/* Missing Keywords */}
                <div className="border border-white/5 bg-[#0a0a0d]/50 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-500 uppercase tracking-wider font-mono">
                    <AlertCircle className="w-4 h-4" />
                    <span>Missing Keywords ({missingKeywords.length})</span>
                  </div>
                  {missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/5 text-yellow-400/80 border border-yellow-500/10 flex items-center gap-1">
                          <span className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-green-500 italic">Excellent! Zero missing core keywords detected.</p>
                  )}
                </div>
              </div>

              {/* Actionable Optimization Checklist */}
              {recommendations.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">ATS Calibration Checklist</h4>
                      <p className="text-[11px] text-gray-500">Apply these suggestions to your resume draft to maximize score accuracy.</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/5 text-gray-300 font-mono">
                      Completed: {completedRecsCount}/{totalRecs}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendations.map((rec, i) => {
                      const isChecked = !!completedRecommendations[i];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleRecommendation(i.toString())}
                          className={`p-4 rounded-xl text-left border transition-all flex gap-3 items-start cursor-pointer ${isChecked ? 'bg-green-500/5 border-green-500/20 text-gray-200' : 'bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-gray-400'}`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 bg-black/40'}`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <p className="text-xs leading-relaxed">{rec}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 2. ATS RESUME PREVIEW PANEL
interface ResumeScreenProps {
  content: string;
  resumeFont: 'sans' | 'serif' | 'mono';
  setResumeFont: (f: 'sans' | 'serif' | 'mono') => void;
  resumeTheme: 'light' | 'dark';
  setResumeTheme: (t: 'light' | 'dark') => void;
  handleCopy: () => void;
  handleDownload: () => void;
}

function ResumeScreen({ 
  content, 
  resumeFont, 
  setResumeFont, 
  resumeTheme, 
  setResumeTheme, 
  handleCopy, 
  handleDownload 
}: ResumeScreenProps) {
  const [copied, setCopied] = useState(false);

  const triggerCopy = () => {
    handleCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasPlaceholders = (content.match(/\[Add.*?\]/gi) || []).length > 0;
  const placeholderCount = (content.match(/\[Add.*?\]/gi) || []).length;

  return (
    <div className="space-y-4">
      {/* Resume Layout Controls */}
      <div className="bg-[#0f0f13] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          {/* Font choice selection */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Typographical style</span>
            <div className="flex p-0.5 rounded-lg bg-black/40 border border-white/5 gap-1">
              {(['sans', 'serif', 'mono'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => setResumeFont(font)}
                  className={`px-3 py-1 text-xs rounded-md font-medium uppercase tracking-wider transition-all ${resumeFont === font ? 'bg-green-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Theme selection */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Contrast preset</span>
            <div className="flex p-0.5 rounded-lg bg-black/40 border border-white/5 gap-1">
              <button
                onClick={() => setResumeTheme('light')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${resumeTheme === 'light' ? 'bg-white text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                Light Page
              </button>
              <button
                onClick={() => setResumeTheme('dark')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${resumeTheme === 'dark' ? 'bg-[#1a1a1e] text-white border border-white/10' : 'text-gray-400 hover:text-white'}`}
              >
                Dark Panel
              </button>
            </div>
          </div>
        </div>

        {/* Exporters */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Copied Plain Text</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Plain Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-400 border border-transparent text-xs font-bold text-black transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>
        </div>
      </div>

      {/* Placeholder Warnings */}
      {hasPlaceholders && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3 text-yellow-400 text-xs">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-yellow-500 animate-pulse" />
          <div className="space-y-1">
            <h4 className="font-bold">Missing Metrics & Placeholders Detected ({placeholderCount})</h4>
            <p className="leading-relaxed text-gray-300">
              Your generated resume contains empty brackets or placeholders like <code className="bg-yellow-500/10 px-1 py-0.5 rounded text-yellow-400 font-mono">[Add metric]</code> because there was insufficient data in your raw inputs. Please fill these in before exporting!
            </p>
          </div>
        </div>
      )}

      {/* Resume Card Rendering */}
      <div className={`border rounded-3xl overflow-hidden transition-all shadow-xl ${resumeTheme === 'light' ? 'bg-[#fcfcfd] border-gray-200/50 text-gray-800' : 'bg-[#0f0f13] border-white/5 text-gray-300'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] dark:border-white/5 bg-black/[0.01]">
          <span className="text-[10px] font-bold font-mono tracking-widest opacity-50 uppercase">ATS Resume Output</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-mono opacity-50">Single-Column Print Optimized</span>
          </div>
        </div>

        <div className="p-8 md:p-12 overflow-x-auto">
          <div 
            className={`whitespace-pre-wrap leading-relaxed text-sm max-w-full overflow-x-hidden ${resumeFont === 'serif' ? 'font-serif text-[15px]' : resumeFont === 'mono' ? 'font-mono text-xs' : 'font-sans text-sm'} ${resumeTheme === 'light' ? 'text-gray-900 bg-transparent' : 'text-gray-200 bg-transparent'}`}
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/^### (.*$)/gim, '<h3 class="text-base font-extrabold uppercase mt-6 mb-2 tracking-wide border-b pb-0.5 border-current">$1</h3>')
                .replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold uppercase mt-7 mb-2 tracking-wide border-b pb-0.5 border-current">$1</h2>')
                .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold uppercase text-center mt-8 mb-4 tracking-widest">$1</h1>')
                .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em class="italic opacity-85">$1</em>')
                .replace(/^---$/gim, '<hr class="my-6 opacity-10" />')
                .replace(/^[\*\-] (.*$)/gim, '<div class="flex gap-2 pl-4 mb-1.5"><span class="opacity-50">•</span><span>$1</span></div>')
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 3. LINKEDIN KIT SCREEN
function LinkedInScreen({ rawContent, handleDownload }: { rawContent: string; handleDownload: () => void }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAbout, setCopiedAbout] = useState(false);

  // Parse headlines vs About section
  let headlines: string[] = [];
  let aboutText = '';

  try {
    const sections = rawContent.split('\n\n');
    // Lines starting with Headline
    headlines = rawContent.split('\n').filter(line => line.trim().match(/^Headline\s*\d/i)).map(l => l.replace(/^Headline\s*\d\s*[\-—:]\s*/i, '').trim());
    
    // About is anything that is not a headline and contains paragraphs
    const aboutIndex = rawContent.toLowerCase().indexOf('headline');
    if (aboutIndex === -1) {
      aboutText = rawContent;
    } else {
      // split everything after Headlines block
      const paragraphs = rawContent.split('\n\n').filter(p => !p.trim().match(/^Headline/i));
      aboutText = paragraphs.join('\n\n').trim();
    }
  } catch (e) {
    headlines = [];
    aboutText = rawContent;
  }

  // Backup in case parsing failed
  if (headlines.length === 0) {
    headlines = [
      "Software Engineering Intern | React, Node.js & SQL",
      "Full Stack Web Developer | Student at University",
      "CS Candidate | Hands-on experience building systems"
    ];
  }

  const triggerCopyHeadline = (headline: string, idx: number) => {
    navigator.clipboard.writeText(headline);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const triggerCopyAbout = () => {
    navigator.clipboard.writeText(aboutText);
    setCopiedAbout(true);
    setTimeout(() => setCopiedAbout(false), 2000);
  };

  const headlineVibeLabels = [
    "🚀 Skills-Focused",
    "🎯 Project-Focused",
    "📈 Performance-Focused",
    "⚡ Niche-Focused",
    "🌟 Personal Personality"
  ];

  return (
    <div className="space-y-6">
      {/* Headlines Selection List */}
      <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Curated LinkedIn Headlines</h4>
            <p className="text-[11px] text-gray-500">Pick the copy option that fits your career strategy most closely.</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-gray-300 hover:text-white border border-white/5"
          >
            <Download className="w-3 h-3" />
            <span>Save All</span>
          </button>
        </div>

        <div className="space-y-3">
          {headlines.map((hl, i) => (
            <div key={i} className="bg-black/20 border border-white/5 hover:border-white/10 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
              <div className="space-y-1.5 flex-1">
                <span className="text-[9px] font-bold font-mono text-green-500 uppercase tracking-widest bg-green-500/5 border border-green-500/10 px-2 py-0.5 rounded">
                  {headlineVibeLabels[i] || "Branding Angle"}
                </span>
                <p className="text-xs md:text-sm text-white font-medium">{hl}</p>
              </div>
              <button
                onClick={() => triggerCopyHeadline(hl, i)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all shrink-0 flex items-center gap-1 border border-white/5"
              >
                {copiedIndex === i ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Profile Container for About Section */}
      <div className="bg-[#0f0f13] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {/* Mock Banner */}
        <div className="h-28 bg-gradient-to-r from-gray-800 via-gray-900 to-green-950/40 relative">
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded text-[10px] font-mono text-gray-400 border border-white/10">
            LinkedIn Profile Preview
          </div>
        </div>

        {/* Profile Details header */}
        <div className="px-6 md:px-8 pb-4 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-[#0f0f13] bg-gray-800 -mt-10 shrink-0 flex items-center justify-center text-gray-500 text-lg font-bold">
            C
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerCopyAbout}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-green-500/5"
            >
              {copiedAbout ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>About Copy Saved!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy About Section</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* About Section Body */}
        <div className="px-6 md:px-8 pb-8 space-y-3">
          <div className="pb-2 border-b border-white/5">
            <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">About section</h4>
          </div>
          <div className="whitespace-pre-wrap text-xs md:text-sm text-gray-300 leading-relaxed space-y-4">
            {aboutText.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 font-mono">
            <span>Written in 1st person</span>
            <span>{aboutText.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. HR COLD EMAIL SCREEN
function EmailScreen({ rawContent, targetCompany, handleDownload }: { rawContent: string; targetCompany: string; handleDownload: () => void }) {
  const [copiedMail, setCopiedMail] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const { subject, body } = parseColdEmail(rawContent);

  const triggerCopySubject = () => {
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const triggerCopyBody = () => {
    navigator.clipboard.writeText(body);
    setCopiedMail(true);
    setTimeout(() => setCopiedMail(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Mock Mail Client Wrapper */}
      <div className="bg-[#0f0f13] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {/* Mock Mail Bar Header */}
        <div className="bg-white/[0.01] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <div className="w-3 h-3 rounded-full bg-green-500/40" />
          </div>
          <span className="text-[10px] font-mono text-gray-500 tracking-wider">Outreach Mail Simulator</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-gray-300 hover:text-white border border-white/5"
          >
            <Download className="w-3 h-3" />
            <span>Download Draft</span>
          </button>
        </div>

        {/* Header Details Fields */}
        <div className="px-6 py-4 border-b border-white/5 space-y-3 text-xs md:text-sm bg-[#0a0a0d]/30">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-mono w-12 shrink-0">To:</span>
            <span className="text-gray-300 font-medium">hiring.team@{targetCompany ? targetCompany.toLowerCase().replace(/\s+/g, '') : 'company'}.com</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-gray-500 font-mono w-12 shrink-0">Subject:</span>
              <span className="text-white font-semibold truncate">{subject}</span>
            </div>
            <button
              onClick={triggerCopySubject}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-gray-300 hover:text-white transition-all border border-white/5 shrink-0"
            >
              {copiedSubject ? 'Subject Copied' : 'Copy Subject'}
            </button>
          </div>
        </div>

        {/* Email Mail Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="whitespace-pre-wrap font-sans text-xs md:text-sm text-gray-300 leading-relaxed bg-black/20 p-5 rounded-xl border border-white/5">
            {body}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="w-4 h-4 text-green-500" />
              <span>Includes zero templates or bracketed placeholders</span>
            </div>
            <button
              onClick={triggerCopyBody}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-green-500/5"
            >
              {copiedMail ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Email Body Copied!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Copy Entire Email Body</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. INTERVIEW PREP PANEL SCREEN
function InterviewScreen({ rawContent, studiedQuestions, toggleStudied }: { rawContent: string; studiedQuestions: Record<string, boolean>; toggleStudied: (idx: string) => void }) {
  const questions = parseInterviewPrep(rawContent);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const completedCount = Object.keys(studiedQuestions).filter(k => studiedQuestions[k]).length;
  const progressPercent = Math.round((completedCount / Math.max(1, questions.length)) * 100);

  return (
    <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and study stats tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Personalized Interview Coach</h4>
          <p className="text-[11px] text-gray-500 font-sans">Curated specifically based on the projects and tech stack you provided.</p>
        </div>
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shrink-0">
          <div className="text-right">
            <span className="text-[9px] block text-gray-500 uppercase font-bold">Preparation status</span>
            <span className="text-xs text-white font-mono font-bold">{completedCount} of {questions.length} completed</span>
          </div>
          <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {questions.length > 0 ? (
          questions.map((q, idx) => {
            const isExpanded = expandedIndex === idx;
            const isReviewed = !!studiedQuestions[idx.toString()];

            return (
              <div 
                key={idx} 
                className={`border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-black/30 border-green-500/20 shadow-md' : 'bg-black/10 border-white/5 hover:border-white/10'}`}
              >
                {/* Accordion Trigger Header */}
                <div 
                  className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStudied(idx.toString());
                      }}
                      className={`w-5 h-5 rounded-md mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${isReviewed ? 'bg-green-500 border-green-500 text-black' : 'border-white/10 hover:border-white/20 bg-black/40'}`}
                    >
                      {isReviewed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-green-500 bg-green-500/5 px-2 py-0.5 border border-green-500/10 rounded uppercase">
                        Q{q.qNumber} — {q.category}
                      </span>
                      <p className="text-xs md:text-sm font-semibold text-white truncate-2-lines">{q.question}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-gray-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Accordion Expanded Body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-white/5 bg-white/[0.005] space-y-4">
                        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl relative">
                          <span className="absolute top-2.5 right-3 text-[9px] font-bold font-mono tracking-wider text-green-500 uppercase">Coaching Guideline</span>
                          <h5 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5 font-mono">
                            <span className="text-green-500">→</span> HOW TO APPROACH THIS ANSWER:
                          </h5>
                          <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-sans">{q.approach}</p>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleStudied(idx.toString())}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${isReviewed ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-green-500 hover:bg-green-400 text-black'}`}
                          >
                            {isReviewed ? 'Mark as Uncompleted' : 'Mark as Reviewed & Studied'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center p-8 border border-dashed border-white/5 rounded-xl text-gray-500 text-xs">
            Failed to parse questions into flashcard view. You can view the raw text of Section 5 in your outputs.
          </div>
        )}
      </div>
    </div>
  );
}
