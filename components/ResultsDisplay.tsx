import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import { JobToolkit, ResumeAnalysis, UserInput } from '../types';
import { analyzeResume } from '../services/geminiService';
import { ResumePreview, TemplateType } from './ResumePreview';
import { ResumeIcon } from './icons/ResumeIcon';
import { CoverLetterIcon } from './icons/CoverLetterIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { InterviewIcon } from './icons/InterviewIcon';
import { RoadmapIcon } from './icons/RoadmapIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface ResultsDisplayProps {
  toolkit: JobToolkit;
  userInput: UserInput;
  onReset: () => void;
  onRegenerateRoadmap: (newRole: string, useThinkingModel: boolean) => Promise<void>;
}

type Tab = 'resume' | 'coverLetter' | 'linkedin' | 'interview' | 'roadmap' | 'elite';

const tabs: { id: Tab; name: string; icon: any }[] = [
  { id: 'resume', name: 'Resume', icon: ResumeIcon },
  { id: 'coverLetter', name: 'Cover Letter', icon: CoverLetterIcon },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
  { id: 'interview', name: 'Mock Interview', icon: InterviewIcon },
  { id: 'roadmap', name: 'Career Roadmap', icon: RoadmapIcon },
  { id: 'elite', name: 'Elite Tools', icon: () => <span className="text-lg">⚡</span> },
];

const Tooltip = ({ text, children, position = 'top' }: { text: string; children?: React.ReactNode; position?: 'top' | 'bottom' }) => (
  <div className="relative group">
    {children}
    <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-50 shadow-md transition-opacity duration-200`}>
      {text}
      <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${position === 'top' ? 'top-full border-t-slate-800' : 'bottom-full border-b-slate-800'}`}></div>
    </div>
  </div>
);

const SuccessModal = ({ email, transactionId }: { email: string, transactionId: string }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                 <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-100"></div>
                 <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping delay-200"></div>
            </div>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 relative z-10">You're In! 🚀</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4 relative z-10">Elite features have been successfully unlocked.</p>
            
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-left relative z-10">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-lg">🧾</span>
                    <span className="text-xs font-bold uppercase text-slate-500">Invoice Sent Automatically</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p>To: <span className="font-semibold text-slate-900 dark:text-white">{email}</span></p>
                    <p>Txn ID: <span className="font-mono text-blue-600 dark:text-blue-400">{transactionId}</span></p>
                    <p className="text-green-600 dark:text-green-500 font-medium">Status: Paid (₹25)</p>
                </div>
            </div>
        </div>
    </div>
);

const ActionButtons: React.FC<{ 
    textToCopy: string; 
    onDownloadPDF?: () => void; 
    onShare?: () => void;
    templateSelector?: React.ReactNode 
}> = ({ textToCopy, onDownloadPDF, onShare, templateSelector }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4 sm:mb-0">
            {templateSelector}
            <div className="flex gap-2">
                {onShare && (
                     <Tooltip text="Get Shareable Link" position="bottom">
                        <button onClick={onShare} className="bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 p-2 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                            <ShareIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                )}
                {onDownloadPDF && (
                    <Tooltip text="Download as PDF" position="bottom">
                        <button onClick={onDownloadPDF} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                            <DownloadIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                )}
                <Tooltip text="Copy to Clipboard" position="bottom">
                    <button onClick={handleCopy} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                        {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

const ProUpsellCard: React.FC<{ description: string; onUnlock: () => void }> = ({ description, onUnlock }) => (
    <div className="mt-10 bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-6 relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all border border-slate-700" onClick={onUnlock}>
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-2 tracking-wide">
                    <span className="bg-amber-400/20 text-amber-300 p-1 rounded-lg">👑</span>
                    ELITE ONE-TIME UNLOCK
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{description}</p>
            </div>
            <button className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-sm rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5 transition-all">
                Get Access - ₹25
            </button>
        </div>
    </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ toolkit, userInput, onReset, onRegenerateRoadmap }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isRegeneratingRoadmap, setIsRegeneratingRoadmap] = useState(false);
  const [useThinkingModel, setUseThinkingModel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Classic');
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  
  // State for LinkedIn Headline Swapping
  const [currentHeadline, setCurrentHeadline] = useState(toolkit.linkedin.headline);

  const [isProMember, setIsProMember] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('jobHero_isPro') === 'true';
    return false;
  });

  const getRazorpayKey = () => {
    try {
        // @ts-ignore
        if (import.meta && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) return import.meta.env.VITE_RAZORPAY_KEY_ID;
    } catch(e) {}
    try {
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.VITE_RAZORPAY_KEY_ID) return process.env.VITE_RAZORPAY_KEY_ID;
        }
    } catch(e) {}
    return null;
  };

  const handlePaymentSuccess = (txnId: string) => {
    setIsProMember(true);
    localStorage.setItem('jobHero_isPro', 'true');
    setTransactionId(txnId || "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase());
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 6000);
  };

  const handleRazorpayPayment = () => {
    const key = getRazorpayKey();
    if (!window.Razorpay) { alert("Razorpay SDK not loaded."); return; }
    if (!key) {
        if (confirm("⚠️ KEY MISSING. Click OK to Simulate Success.")) handlePaymentSuccess("SIM_TEST_" + Date.now());
        return;
    }

    const options = {
        key: key, 
        amount: 2500, // 25 INR
        currency: "INR",
        name: "JobHero AI",
        description: "Elite Unlock (Lifetime)",
        handler: function (response: any) { handlePaymentSuccess(response.razorpay_payment_id); },
        prefill: {
            name: userInput.fullName,
            email: userInput.email,
            contact: userInput.phone
        },
        theme: { color: "#F59E0B" }
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleAnalyzeResume = async () => {
      setIsAnalyzing(true);
      try {
          const result = await analyzeResume(toolkit.resume, userInput.jobRoleTarget);
          setResumeAnalysis(result);
      } catch (e) {
          alert("Could not analyze resume. Try again.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleGenerateShareLink = () => {
      const payload = { r: toolkit.resume, t: selectedTemplate, n: userInput.fullName, e: userInput.email, p: userInput.phone, l: userInput.linkedinGithub || "" };
      const shareUrl = `${window.location.origin}${window.location.pathname}?shareData=${btoa(encodeURIComponent(JSON.stringify(payload)))}`;
      navigator.clipboard.writeText(shareUrl).then(() => alert("Link Copied!"));
  };

  const handleDownloadPDF = (type: 'resume' | 'coverLetter') => {
    const isProTemplate = selectedTemplate === 'Elegant' || selectedTemplate === 'Executive';
    if (!isProMember && isProTemplate) { handleRazorpayPayment(); return; }

    const doc = new jsPDF();
    const content = type === 'resume' ? toolkit.resume : toolkit.coverLetter;
    const cleanText = content.replace(/[^\x00-\x7F\n\r\t•\-.,()@:/]/g, " "); // Simple ASCII clean
    
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(cleanText, 180);
    doc.text(lines, 15, 15);
    doc.save(`${type}_JobHero.pdf`);
  };

  const handleRoadmapUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    setIsRegeneratingRoadmap(true);
    try {
      await onRegenerateRoadmap(newRoleInput, useThinkingModel);
      setNewRoleInput('');
    } catch (error) {
      alert("Failed to update roadmap.");
    } finally {
      setIsRegeneratingRoadmap(false);
    }
  };

  const contentToCopy = (tab: Tab): string => {
    if (tab === 'resume') return toolkit.resume;
    if (tab === 'coverLetter') return toolkit.coverLetter;
    if (tab === 'linkedin') return `${currentHeadline}\n\n${toolkit.linkedin.bio}`;
    if (tab === 'interview') return toolkit.mockInterview.questions.map(q => q.question).join('\n');
    if (tab === 'elite') return `${toolkit.coldEmail}\n\n${toolkit.salaryNegotiation}`;
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {showSuccessModal && <SuccessModal email={userInput.email} transactionId={transactionId} />}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-0 px-4 sm:px-0">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border-t border-x border-transparent dark:border-slate-700'
                  : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            {isProMember && <span className="px-3 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1"><span>👑</span> ELITE</span>}
            <button onClick={onReset} className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:text-red-500">
                <RefreshIcon className="h-4 w-4 inline mr-2" />Start Over
            </button>
        </div>
      </div>

      <div className="relative bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-b-xl rounded-tr-xl shadow-lg mt-0 min-h-[500px] transition-colors duration-300">
        {activeTab === 'resume' && (
            <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                     <ActionButtons textToCopy={contentToCopy('resume')} onDownloadPDF={() => handleDownloadPDF('resume')} onShare={handleGenerateShareLink}
                        templateSelector={
                           <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border px-2 py-1">
                               <span className="text-xs font-semibold mr-2">TEMPLATE:</span>
                               <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)} className="text-xs border-none bg-transparent outline-none cursor-pointer">
                                   <option value="Classic">Classic</option>
                                   <option value="Modern">Modern</option>
                                   <option value="Creative">Creative</option>
                                   <option value="Elegant">Elegant {isProMember ? '' : '👑'}</option>
                                   <option value="Executive">Executive {isProMember ? '' : '👑'}</option>
                               </select>
                           </div>
                        }
                    />
                </div>
                
                {isProMember && (
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 relative z-10">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">🤖 Deep AI Resume Audit</h3>
                                <p className="text-sm text-slate-500">Target Role: <span className="text-blue-600">{userInput.jobRoleTarget}</span></p>
                            </div>
                            <button onClick={handleAnalyzeResume} disabled={isAnalyzing} className="mt-4 md:mt-0 text-sm font-bold bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {isAnalyzing ? "Auditing..." : "Run Deep Audit"}
                            </button>
                        </div>
                        
                        {resumeAnalysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                     <div className="text-center">
                                         <div className="text-4xl font-black text-blue-600">{resumeAnalysis.score ?? 0}</div>
                                         <div className="text-xs font-bold text-slate-400">ATS Score</div>
                                     </div>
                                     <div className="text-center">
                                         <div className="text-xl font-bold text-green-600">{resumeAnalysis.jobFitPrediction ?? "N/A"}</div>
                                         <div className="text-xs font-bold text-slate-400">Fit</div>
                                     </div>
                                </div>
                                <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100">
                                    <h4 className="font-bold text-red-900 dark:text-red-300 text-sm mb-2">Missing Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {resumeAnalysis.missingKeywords?.length > 0 ? resumeAnalysis.missingKeywords.map((k, i) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-red-200 text-red-700 text-xs rounded-md">{k}</span>
                                        )) : <span className="text-xs">None detected.</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100/50 dark:bg-slate-900/50 p-1 sm:p-4 shadow-inner">
                     <ResumePreview text={toolkit.resume} template={selectedTemplate} isBlurred={!isProMember && (selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')} onUnlock={handleRazorpayPayment} userInput={userInput} />
                </div>
                {!isProMember && <ProUpsellCard description="Unlock Elite Templates & Deep AI Audit." onUnlock={handleRazorpayPayment} />}
            </>
        )}

        {activeTab === 'coverLetter' && (
            <>
                <ActionButtons textToCopy={contentToCopy('coverLetter')} onDownloadPDF={() => handleDownloadPDF('coverLetter')} />
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 pt-8 sm:pt-0 bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-100 dark:border-slate-700 rounded-lg min-h-[600px]">
                    {toolkit.coverLetter}
                </div>
            </>
        )}

        {activeTab === 'linkedin' && (
          <div className="space-y-6">
            <ActionButtons textToCopy={contentToCopy('linkedin')} />
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Optimized Headline</h3>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">{currentHeadline}</p>
                
                {toolkit.linkedin.alternativeHeadlines && toolkit.linkedin.alternativeHeadlines.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 mb-3">AI Suggestions (Click to swap):</p>
                        <div className="space-y-2">
                            {toolkit.linkedin.alternativeHeadlines.map((headline, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setCurrentHeadline(headline)}
                                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors flex justify-between items-center group"
                                >
                                    <span>{headline}</span>
                                    <span className="text-blue-600 opacity-0 group-hover:opacity-100 text-xs font-bold">USE THIS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">About Section</h3>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{toolkit.linkedin.bio}</p>
            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="space-y-6">
            <ActionButtons textToCopy={contentToCopy('interview')} />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm">
                {toolkit.mockInterview.intro}
            </div>
            {toolkit.mockInterview.questions.map((item, index) => (
                <div key={index} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">{index + 1}</div>
                      <div>
                          <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">{item.question}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border-l-2 border-green-500">
                              💡 {item.feedback}
                          </p>
                      </div>
                  </div>
                </div>
            ))}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                   <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">Pivot to new role?</label>
                   <input type="text" placeholder="e.g. 'AI Engineer'" className="block w-full rounded-md border-slate-300 dark:border-slate-600 p-2 text-sm" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setUseThinkingModel(!useThinkingModel)}>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useThinkingModel ? 'bg-purple-600' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${useThinkingModel ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">Deep Think</span>
                </div>
                <button onClick={handleRoadmapUpdate} disabled={isRegeneratingRoadmap} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold disabled:opacity-50">
                    {isRegeneratingRoadmap ? 'Thinking...' : 'Regenerate'}
                </button>
            </div>
            
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-12 pl-8 pb-4">
                {Array.isArray(toolkit.careerRoadmap) ? toolkit.careerRoadmap.map((step, i) => (
                    <div key={i} className="relative group">
                        <div className="absolute -left-[41px] w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 bg-blue-500 shadow-sm group-hover:scale-125 transition-transform"></div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">{step.duration}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-3">{step.description}</p>
                        <div className="flex flex-wrap gap-2">
                            {step.tools?.map((tool, t) => (
                                <span key={t} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-100 dark:border-blue-800">
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="p-4 bg-red-50 text-red-600 rounded">Legacy roadmap format. Please regenerate.</div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'elite' && (
            <div className="space-y-8">
                {isProMember ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white font-bold flex justify-between">
                                    <span>📧 Cold Email</span>
                                    <button onClick={() => navigator.clipboard.writeText(toolkit.coldEmail)} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Copy</button>
                                </div>
                                <div className="p-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    {toolkit.coldEmail || "Regenerate to see Cold Email."}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white font-bold flex justify-between">
                                    <span>💰 Salary Negotiation</span>
                                    <button onClick={() => navigator.clipboard.writeText(toolkit.salaryNegotiation)} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Copy</button>
                                </div>
                                <div className="p-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    {toolkit.salaryNegotiation || "Regenerate to see Script."}
                                </div>
                            </div>
                        </div>
                        <div className="text-center text-slate-400 text-xs mt-8">
                            These tools are generated based on your profile and target role to maximize conversion.
                        </div>
                    </>
                ) : (
                   <div className="flex flex-col items-center justify-center py-16 text-center">
                       <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mb-6">🔒</div>
                       <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Elite Tools Locked</h2>
                       <p className="text-slate-500 max-w-md mb-8">Get access to the <strong>Cold Email Generator</strong> (for reaching founders) and the <strong>Salary Negotiation Script</strong> (to increase your offer).</p>
                       <button onClick={handleRazorpayPayment} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform">
                           Unlock All Features - ₹25
                       </button>
                   </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default ResultsDisplay;