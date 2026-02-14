import React from 'react';

// A lightweight component that returns an SVG based on a matching keyword
export const TechIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-4 h-4" }) => {
  if (!name || typeof name !== 'string') return null;
  
  const n = name.toLowerCase().trim();

  // Helper to check if name contains a keyword
  const is = (keyword: string) => n.includes(keyword);

  // Basic SVG paths for common tech
  const icons: Record<string, React.ReactNode> = {
    'react': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#61DAFB' }}>
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="2.5"/>
      </svg>
    ),
    'angular': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#DD0031' }}>
        <path d="M12 2.5L3.5 6l1.5 12.5L12 21.5l7-3 1.5-12.5L12 2.5zm0 2.5v13.5l-5-2.5-1-9L12 5z"/>
      </svg>
    ),
    'vue': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#4FC08D' }}>
        <path d="M2 3h4l6 10.4L18 3h4L12 20 2 3z"/>
        <path d="M6.5 3h3L12 7.5 14.5 3h3L12 12.5 6.5 3z" fill="#35495E"/>
      </svg>
    ),
    'svelte': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#FF3E00' }}>
        <path d="M12 2L3 6v12l9 4 9-4V6l-9-4zm0 2.5c3 0 5.5 2.5 5.5 5.5S15 15.5 12 15.5 6.5 13 6.5 10 9 4.5 12 4.5z"/>
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
    'kubernetes': (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#326CE5' }}>
        <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2zm0 2.5L5.5 8v8l6.5 3.5 6.5-3.5V8L12 4.5z"/>
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
    'mongo': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#47A248' }}>
          <path d="M12 2C6.48 2 2 12 2 12s4.48 10 10 10 10-10 10-10S17.52 2 12 2zm0 18c-4.41 0-8-4.48-8-8s3.59-8 8-8 8 4.48 8 8-3.59 8-8 8z"/>
          <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    'java': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#007396' }}>
           <path d="M12 3C8 3 6 8 6 12s2 9 6 9 6-5 6-9-2-9-6-9zm0 16c-2.5 0-4-3.5-4-7s1.5-7 4-7 4 3.5 4 7-1.5 7-4 7z"/>
        </svg>
    ),
    'c#': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#239120' }}>
            <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1" fill="none"/>
            <text x="50%" y="65%" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">C#</text>
        </svg>
    ),
    'c++': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#00599C' }}>
            <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1" fill="none"/>
             <text x="50%" y="65%" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">C++</text>
        </svg>
    ),
    'go': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#00ADD8' }}>
             <path d="M2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm5 0h10" stroke="currentColor" strokeWidth="4"/>
        </svg>
    ),
    'rust': (
         <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#000000' }}>
            <circle cx="12" cy="12" r="10" fillOpacity="0.1"/>
            <path d="M12 4l2 4h-4l2-4zm0 16l-2-4h4l-2 4zM4 12l4-2v4l-4-2zm16 0l-4 2v-4l4 2z"/>
         </svg>
    ),
    'swift': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#F05138' }}>
            <path d="M12 2L2 22h20L12 2z"/>
        </svg>
    ),
    'flutter': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#02569B' }}>
            <path d="M5 2l7 7-7 7M12 2l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    'linux': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#FCC624' }}>
            <path d="M12 2C8 2 5 6 5 10s2 8 2 10 3 2 5 2 5-2 5-2 2-6 2-10-3-8-7-8z"/>
        </svg>
    ),
    'azure': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#0078D4' }}>
            <path d="M4 12L12 4l8 8-8 8-8-8z"/>
        </svg>
    ),
    'gcp': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#4285F4' }}>
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v4h3l-4 7z"/>
        </svg>
    ),
    'default': (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#94a3b8' }}>
            <circle cx="12" cy="12" r="6" />
        </svg>
    )
  };

  // Check for substring match (e.g. 'React.js' matches 'react')
  // Priority check: strict includes first
  let key = Object.keys(icons).find(k => k !== 'default' && is(k));
  
  // Aliases mapping
  if (!key) {
      if (is('js') && !is('json')) key = 'javascript';
      else if (is('ts')) key = 'typescript';
      else if (is('csharp')) key = 'c#';
      else if (is('golang')) key = 'go';
      else if (is('postgres')) key = 'sql'; // Fallback for specific sql
  }

  return key ? <>{icons[key]}</> : <>{icons['default']}</>;
};