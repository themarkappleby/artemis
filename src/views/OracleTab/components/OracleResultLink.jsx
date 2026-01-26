import React from 'react';
import ReactMarkdown from 'react-markdown';

// Helper component for rendering oracle results with clickable links
export const OracleResultLink = ({ href, children, onNavigate }) => {
  const handleClick = (e) => {
    if (href && href.startsWith('Starforged/') && onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };
  return (
    <a 
      href={href} 
      onClick={handleClick} 
      style={{ color: '#007AFF', textDecoration: 'none' }}
    >
      {children}
    </a>
  );
};

// Factory to create a render function for oracle results with markdown
export const createOracleResultRenderer = (onNavigate) => (result) => (
  <ReactMarkdown 
    components={{ 
      a: (props) => <OracleResultLink {...props} onNavigate={onNavigate} />,
      p: ({ children }) => <>{children}</> 
    }}
  >
    {result}
  </ReactMarkdown>
);
