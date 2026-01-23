import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DetailCard.css';

export const DetailCard = ({ icon, title, description }) => {
  return (
    <div className="detail-card">
      {icon && <div className="detail-card-icon">{icon}</div>}
      <h2 className="detail-card-title">{title}</h2>
      {description && (
        <div className="detail-card-description">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};
