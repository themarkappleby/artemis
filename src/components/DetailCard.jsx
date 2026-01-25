import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DetailCard.css';

export const DetailCard = ({ icon, iconBg, title, description, onLinkClick }) => {
  // Custom link component that handles internal move links
  const LinkRenderer = ({ href, children }) => {
    const handleClick = (e) => {
      // Check if this is an internal Starforged move link
      if (href && href.startsWith('Starforged/Moves/') && onLinkClick) {
        e.preventDefault();
        onLinkClick(href);
      }
    };

    return (
      <a href={href} onClick={handleClick}>
        {children}
      </a>
    );
  };

  return (
    <div className="detail-card">
      {icon && (
        <div 
          className="detail-card-icon"
          style={iconBg ? { backgroundColor: iconBg } : undefined}
        >
          {icon}
        </div>
      )}
      {title && <h2 className="detail-card-title">{title}</h2>}
      {description && (
        <div className="detail-card-description">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: LinkRenderer
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
