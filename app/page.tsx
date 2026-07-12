'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, FileText, Linkedin, Mail, X, LogOut, Loader2, AlertCircle, CheckCircle2, TrendingUp, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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

const formatMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-300">$1</em>')
    .replace(/^---$/gim, '<hr class="my-6 border-white/10" />')
    .replace(/^[\*\-] (.*$)/gim, '<div class="flex gap-2 mb-1"><span class="text-green-500">•</span><span>$1</span></div>');
};

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

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
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
    await supabase.auth.signOut();
    router.push('/login');
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
        } catch (parseError) {
          // If we fail to parse JSON, we just use the default text
        }
        throw new Error(errorMsg);
      }

      const { text } = await res.json();
      
      let resume = '', linkedinKit = '', coldEmail = '', interviewPrep = '', atsAnalysis = '';

      // Match based on new prompt's section headers
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

      // Fallback for the old format just in case
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

      setContent({
        resume: resume.replace(/^===/,'').trim(),
        linkedinKit: linkedinKit.replace(/^===/,'').trim(),
        coldEmail: coldEmail.replace(/^===/,'').trim(),
        interviewPrep: interviewPrep.replace(/^===/,'').trim(),
        atsAnalysis: atsAnalysis.replace(/^===/,'').trim() || undefined,
      });

    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate placement kit. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      // 1. Create Order
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

      // 2. Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        // 3. Open Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: 19900,
          currency: 'INR',
          name: 'AtlasCV',
          description: 'Pro Plan - Unlimited Generations',
          order_id: orderId,
          theme: { color: '#22c55e' },
          handler: async function (response: any) {
            // Verify payment
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
                  
                  // Automatically trigger generation
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

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-green-500/30 bg-[#0a0a0a]">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-xl tracking-tight text-green-500">AtlasCV</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:inline-block">
            {user?.email}
          </span>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors border border-white/10 rounded-full bg-transparent hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 md:py-20 flex flex-col items-center relative">
        
        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white">
            Your <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Placement Kit</span><br />
            in 60 seconds
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Resume + LinkedIn + HR Email — from one text dump
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            <span className="px-4 py-1.5 rounded-full border border-green-500/30 text-sm font-medium text-green-500 bg-transparent flex items-center gap-2">
              <FileText className="w-4 h-4" /> ATS Resume
            </span>
            <span className="px-4 py-1.5 rounded-full border border-green-500/30 text-sm font-medium text-green-500 bg-transparent flex items-center gap-2">
              <Linkedin className="w-4 h-4" /> LinkedIn Kit
            </span>
            <span className="px-4 py-1.5 rounded-full border border-green-500/30 text-sm font-medium text-green-500 bg-transparent flex items-center gap-2">
              <Mail className="w-4 h-4" /> Cold Email
            </span>
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full">
          <div className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
            <label htmlFor="details" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              TELL US ABOUT YOURSELF — DON&apos;T OVERTHINK IT
            </label>
            <textarea
              id="details"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Just dump everything here. Like a WhatsApp message to a friend.&#10;&#10;Example: name rahul, btech cse 3rd year AKTU, made a todo app in react, know python and java, want job at TCS or any startup, got 74% in 12th, have a Google Cloud cert...&#10;&#10;More you write, better the output. But even 2 lines works."
              className="w-full h-48 md:h-64 bg-transparent text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-0 text-base md:text-lg"
              maxLength={3000}
            />
            <div className="text-right mt-2 text-xs text-gray-500">
              {input.length} / 3000 characters
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">TARGET COMPANY (OPTIONAL)</label>
                <input 
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google, Infosys, a startup you admire"
                  className="w-full bg-transparent border-b border-white/20 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500 pb-2 text-sm md:text-base transition-colors duration-300"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">TARGET ROLE (OPTIONAL)</label>
                <input 
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. SDE Intern, ML Engineer, Product Intern"
                  className="w-full bg-transparent border-b border-white/20 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500 pb-2 text-sm md:text-base transition-colors duration-300"
                />
              </div>
            </div>
            
            <div className="mt-6 w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">JOB DESCRIPTION (OPTIONAL — HIGHLY RECOMMENDED FOR ATS MATCH)</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here to optimise your keywords..."
                className="w-full h-32 bg-transparent border border-white/20 rounded-xl p-4 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors duration-300 resize-none text-sm md:text-base"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-between pt-4 gap-4 w-full">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                No formatting needed | No forms
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isInitializing}
                className={`w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base ${input.trim() && !isGenerating ? 'animate-pulse' : ''}`}
              >
                Generate My Placement Kit <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 w-full text-center">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="w-full mt-16 flex flex-col items-center justify-center space-y-4">
            <div className="flex gap-2">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-3 h-3 bg-green-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 bg-green-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <p className="text-green-500 font-medium animate-pulse">Generating your kit...</p>
          </div>
        )}

        {/* Output Sections */}
        <AnimatePresence>
          {content && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-16 space-y-8"
            >
              <h2 className="font-heading text-2xl font-bold text-center text-white mb-8">
                Your Placement Kit is Ready
              </h2>

              <OutputCard 
                title="1. ATS Resume" 
                content={content.resume} 
                warning={
                  (content.resume.match(/\[Add.*?\]/gi) || []).length > 0
                    ? `Action Required: We found ${(content.resume.match(/\[Add.*?\]/gi) || []).length} missing placeholder(s) like [Add metric] or [Add Link]. Please fill them in before applying!`
                    : "Review your resume carefully before submitting."
                }
              />
              
              {content.atsAnalysis && (
                <AtsAnalysisCard 
                  rawContent={content.atsAnalysis} 
                />
              )}
              
              <OutputCard 
                title="2. LinkedIn Kit" 
                content={content.linkedinKit} 
              />
              
              <OutputCard 
                title="3. Cold Email to HR" 
                content={content.coldEmail} 
              />

              <OutputCard 
                title="4. Interview Prep" 
                content={content.interviewPrep} 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center mt-auto flex flex-col items-center gap-4">
        <p className="text-sm text-gray-500">
          AtlasCV · Built for India&apos;s next generation of engineers
        </p>
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
              className="relative w-full max-w-[420px] bg-[#111] border border-white/10 rounded-2xl p-10 flex flex-col items-center shadow-2xl"
            >
              <button 
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>

              <h2 className="text-white font-bold text-2xl text-center mb-2">
                You&apos;ve used your 3 free generations
              </h2>
              
              <p className="text-gray-400 text-sm text-center mb-8">
                Upgrade to AtlasCV Pro for unlimited resume, LinkedIn, and HR email generations.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-green-500 text-4xl font-bold">₹199</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>

              <ul className="w-full space-y-4 mb-8">
                {[
                  'Unlimited generations',
                  'All 4 outputs every time',
                  'Priority AI processing',
                  'Cancel anytime'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl transition-colors text-base"
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Welcome to AtlasCV Pro! Generating your kit...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ParsedAtsAnalysis {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  technicalSkillsMatch: number;
  softSkillsMatch: number;
  toolsMethodologiesMatch: number;
  recommendations: string[];
  rawContent: string;
}

function parseAtsAnalysis(rawText: string): ParsedAtsAnalysis | null {
  if (!rawText) return null;

  try {
    const matchMatch = rawText.match(/Match:\s*(\d+)/i);
    const matchPercentage = matchMatch ? parseInt(matchMatch[1], 10) : 0;

    const matchedMatch = rawText.match(/Matched Keywords:\s*([^\n]+)/i);
    const matchedKeywords = matchedMatch && matchedMatch[1].trim() !== '[None]' && matchedMatch[1].trim() !== ''
      ? matchedMatch[1].split(',').map(s => s.trim().replace(/^\[|\]$/g, '').trim()).filter(s => s.toLowerCase() !== 'none' && s.length > 0 && !s.includes('['))
      : [];

    const missingMatch = rawText.match(/Missing Keywords:\s*([^\n]+)/i);
    const missingKeywords = missingMatch && missingMatch[1].trim() !== '[None]' && missingMatch[1].trim() !== ''
      ? missingMatch[1].split(',').map(s => s.trim().replace(/^\[|\]$/g, '').trim()).filter(s => s.toLowerCase() !== 'none' && s.length > 0 && !s.includes('['))
      : [];

    const techMatch = rawText.match(/Technical Skills Match:\s*(\d+)/i);
    const technicalSkillsMatch = techMatch ? parseInt(techMatch[1], 10) : 0;

    const softMatch = rawText.match(/Soft Skills Match:\s*(\d+)/i);
    const softSkillsMatch = softMatch ? parseInt(softMatch[1], 10) : 0;

    const toolsMatch = rawText.match(/Tools & Methodologies Match:\s*(\d+)/i);
    const toolsMethodologiesMatch = toolsMatch ? parseInt(toolsMatch[1], 10) : 0;

    const recommendations: string[] = [];
    const lines = rawText.split('\n');
    let isRecs = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('recommendations:')) {
        isRecs = true;
        continue;
      }
      if (isRecs) {
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.substring(1).trim().replace(/^\[|\]$/g, '').trim();
          if (content && !content.includes('[Actionable')) {
            recommendations.push(content);
          }
        }
      }
    }

    // Default backup recommendations if none parsed cleanly
    if (recommendations.length === 0) {
      if (missingKeywords.length > 0) {
        recommendations.push(`Incorporate missing keywords like ${missingKeywords.slice(0, 3).join(', ')} into your Projects or Technical Skills section.`);
      }
      recommendations.push("Ensure your resume bullet points start with strong action verbs (e.g., Developed, Optimized).");
      recommendations.push("Quantify your project impact with real metrics or numbers (e.g., 'reduced latency by 20%') where possible.");
    }

    return {
      matchPercentage,
      matchedKeywords,
      missingKeywords,
      technicalSkillsMatch: technicalSkillsMatch || Math.max(0, matchPercentage - 3),
      softSkillsMatch: softSkillsMatch || Math.max(0, matchPercentage - 8),
      toolsMethodologiesMatch: toolsMethodologiesMatch || Math.max(0, matchPercentage + 2),
      recommendations: recommendations.slice(0, 4),
      rawContent: rawText
    };
  } catch (err) {
    console.error("Failed to parse ATS analysis:", err);
    return null;
  }
}

function AtsAnalysisCard({ rawContent }: { rawContent: string }) {
  const [showRaw, setShowRaw] = useState(false);
  const parsed = parseAtsAnalysis(rawContent);

  if (!parsed) {
    return <OutputCard title="ATS Match Analysis" content={rawContent} />;
  }

  const {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
    technicalSkillsMatch,
    softSkillsMatch,
    toolsMethodologiesMatch,
    recommendations,
  } = parsed;

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return { text: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30', stroke: 'stroke-green-500', bar: 'bg-green-500' };
    if (score >= 50) return { text: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', stroke: 'stroke-yellow-500', bar: 'bg-yellow-500' };
    return { text: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30', stroke: 'stroke-red-500', bar: 'bg-red-500' };
  };

  const colors = getScoreColorClass(matchPercentage);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, matchPercentage))) / 100;

  return (
    <div className="bg-[#0f0f0f] border border-white/10 border-t-2 border-t-green-500 rounded-2xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="font-heading font-semibold text-lg text-green-500">ATS Match Analysis</h3>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          {showRaw ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Visual Report</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Show Raw Report</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {showRaw ? (
            <motion.div
              key="raw-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div 
                className="whitespace-pre-wrap font-sans text-gray-300 text-sm md:text-base leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(rawContent) }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="visual-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center md:justify-start">
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        className="stroke-white/5 fill-transparent"
                        strokeWidth="8"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r={radius}
                        className={`${colors.stroke} fill-transparent transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-heading font-bold text-white">{matchPercentage}%</span>
                      <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Match Score</span>
                    </div>
                  </div>

                  <div className="text-center sm:text-left space-y-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {matchPercentage >= 80 ? 'EXCELLENT MATCH' : matchPercentage >= 50 ? 'GOOD MATCH' : 'NEEDS ALIGNMENT'}
                    </span>
                    <p className="text-gray-400 text-xs md:text-sm max-w-xs">
                      {matchPercentage >= 80 
                        ? 'Your skills and experience closely align with the job description. Ready to submit!'
                        : matchPercentage >= 50
                        ? 'Good alignment, but adding a few key missing technical skills will maximize your interview chances.'
                        : 'Significant keyword mismatch. Review the missing keywords and incorporate them into your experience.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Technical Skills', score: technicalSkillsMatch },
                    { label: 'Soft Skills', score: softSkillsMatch },
                    { label: 'Tools & Methodologies', score: toolsMethodologiesMatch },
                  ].map((category, idx) => {
                    const catColors = getScoreColorClass(category.score);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">{category.label}</span>
                          <span className={catColors.text}>{category.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${category.score}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={`h-full ${catColors.bar} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-500 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Matched Keywords ({matchedKeywords.length})</span>
                  </div>
                  {matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs italic">No matching keywords detected yet. Try adding raw experience details relevant to the job.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    <span>Missing Keywords ({missingKeywords.length})</span>
                  </div>
                  {missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs italic">No missing keywords! You have complete alignment with the target job.</p>
                  )}
                </div>
              </div>

              {recommendations.length > 0 && (
                <div className="pt-6 border-t border-white/5 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ATS Score Optimization Checklist</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3 items-start">
                        <span className="text-green-500 font-bold text-sm select-none shrink-0 mt-0.5">✓</span>
                        <p className="text-gray-300 text-xs md:text-sm leading-snug">{rec}</p>
                      </div>
                    ))}
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

function OutputCard({ 
  title, 
  content, 
  warning
}: { 
  title: string; 
  content: string; 
  warning?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-[#0f0f0f] border border-white/10 border-t-2 border-t-green-500 rounded-2xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <h3 className="font-heading font-semibold text-lg text-green-500">{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-gray-300 transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-6 overflow-x-auto">
        <div 
          className="whitespace-pre-wrap font-sans text-gray-300 text-sm md:text-base leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
        />
        {warning && (
          <div className="mt-8 flex items-center gap-2 text-yellow-500/90 text-sm font-medium">
            <span className="text-base">⚠️</span> {warning}
          </div>
        )}
      </div>
    </div>
  );
}
