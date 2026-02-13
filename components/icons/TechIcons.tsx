import React from 'react';

// A lightweight component that returns an SVG based on a matching keyword
export const TechIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-4 h-4" }) => {
  const n = name.toLowerCase().trim();

  // Basic SVG paths for common tech
  const icons: Record<string, React.ReactNode> = {
    'react': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#61DAFB' }}>
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="2.5"/>
      </svg>
    ),
    'python': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#3776AB' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 7l-2 3h4l-2 3m-3-1l-2 3h4l-2 3"/> 
      </svg>
    ),
    'javascript': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#F7DF1E' }}>
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <path d="M15.5 16c0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5M10 18.5v-6" stroke="black" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'typescript': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#3178C6' }}>
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <path d="M7 18.5v-6H5M9 12.5h-4M16 18.5v-6M13.5 12.5H18.5" stroke="white" strokeWidth="2" />
      </svg>
    ),
    'html': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#E34F26' }}>
        <path d="M3 3l2 16 7 2 7-2 2-16H3zm14 5h-5.5L11 14h4l-.5 2.5-2.5.8-2.5-.8-.3-1.5H7l.5 3 4.5 1.5 4.5-1.5.8-5H8l-.3-2H17v-2z"/>
      </svg>
    ),
    'css': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#1572B6' }}>
        <path d="M3 3l2 16 7 2 7-2 2-16H3zm14 5h-4.5L12 14h3l-.5 2.5-2.5.8-2.5-.8-.3-1.5H7l.5 3 4.5 1.5 4.5-1.5.8-5H8l-.3-2H17v-2z"/>
      </svg>
    ),
    'aws': (
       <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#FF9900' }}>
         <path d="M17.5 14c-.5 0-1 .2-1.5.5v-3c0-.8-.7-1.5-1.5-1.5S13 10.7 13 11.5v3c-.5-.3-1-.5-1.5-.5-1.1 0-2 .9-2 2s.9 2 2 2c.8 0 1.5-.4 1.8-1 .3.6 1 1 1.8 1 1.1 0 2-.9 2-2s-.9-2-2-2zM7 9l5-5 5 5H7z"/>
       </svg>
    ),
    'docker': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#2496ED' }}>
        <path d="M2 13h2v2H2zm3 0h2v2H5zm3 0h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2zm3 0h2v2h-2zM5 10h2v2H5zm3 0h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2z"/>
      </svg>
    ),
    'node': (
       <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#339933' }}>
         <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.5L18.5 8 12 11.5 5.5 8 12 4.5z"/>
       </svg>
    ),
    'git': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#F05032' }}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M6 9v6M9 15l6 1.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    'sql': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#4479A1' }}>
          <path d="M4 6h16v12H4z" fillOpacity="0.3"/>
          <path d="M4 10h16v2H4z"/>
        </svg>
    ),
    'java': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#007396' }}>
           <path d="M12 3C8 3 6 8 6 12s2 9 6 9 6-5 6-9-2-9-6-9zm0 16c-2.5 0-4-3.5-4-7s1.5-7 4-7 4 3.5 4 7-1.5 7-4 7z"/>
        </svg>
    ),
    'default': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#94a3b8' }}>
            <circle cx="12" cy="12" r="6" />
        </svg>
    )
  };

  // Check for substring match (e.g. 'React.js' matches 'react')
  const matchedKey = Object.keys(icons).find(key => n.includes(key));
  return matchedKey ? <>{icons[matchedKey]}</> : <>{icons['default']}</>;
};
