import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { RoadmapStep } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface RoadmapVisualizerProps {
  steps: RoadmapStep[];
}

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({ steps }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'career-roadmap.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download roadmap.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative w-full bg-white dark:bg-slate-950 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Career Roadmap Visualization</h3>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <DownloadIcon className="w-4 h-4" />
          {isDownloading ? 'Capturing...' : 'Download Map'}
        </button>
      </div>

      <div ref={containerRef} className="relative pl-4 md:pl-8 py-4 bg-white dark:bg-slate-950 rounded-xl">
        {/* Vertical Line */}
        <div className="absolute left-[27px] md:left-[43px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const isExpanded = expandedStep === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-6 md:gap-10 group"
              >
                {/* Node */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : index)}
                  className={`relative z-10 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-all duration-300 shrink-0 mt-1 ${
                    isExpanded
                      ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-500'
                  }`}
                >
                  <span className="text-[10px] font-bold">{index + 1}</span>
                </button>

                {/* Content Card */}
                <div
                  className={`flex-1 transition-all duration-300 ${
                    isExpanded ? 'scale-[1.02]' : 'hover:translate-x-1'
                  }`}
                >
                  <div
                    onClick={() => setExpandedStep(isExpanded ? null : index)}
                    className={`cursor-pointer p-5 rounded-xl border transition-all duration-300 ${
                      isExpanded
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h4 className={`font-bold text-sm ${isExpanded ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                        {step.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded self-start md:self-auto">
                        {step.phase || step.duration}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                      {step.description}
                    </p>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-slate-700/50 grid gap-4 md:grid-cols-2">
                            {step.milestones && step.milestones.length > 0 && (
                              <div>
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Milestones</h5>
                                <ul className="space-y-1.5">
                                  {step.milestones.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                      {m}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {step.tools && step.tools.length > 0 && (
                              <div>
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Tools & Tech</h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {step.tools.map((tool, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.resources && step.resources.length > 0 && (
                                <div className="md:col-span-2">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Resources</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {step.resources.map((res, i) => (
                                            <a 
                                                key={i} 
                                                href={res.type === 'Premium' ? '#' : `https://www.google.com/search?q=${encodeURIComponent(res.title)}`}
                                                target={res.type === 'Premium' ? '_self' : '_blank'}
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    if (res.type === 'Premium') {
                                                        e.preventDefault();
                                                        alert("🔒 Premium Resource: This content requires an upgrade to access.");
                                                    }
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                                    res.type === 'Premium' 
                                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer' 
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                                }`}
                                            >
                                                <span>{res.type === 'Premium' ? '🔒' : '📚'}</span> 
                                                {res.title} 
                                                <span className="opacity-50 font-normal">({res.type})</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
