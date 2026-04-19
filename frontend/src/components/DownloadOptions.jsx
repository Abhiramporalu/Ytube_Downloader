import React from 'react';
import { Download } from 'lucide-react';

const DownloadOptions = ({ videoInfo, url }) => {
  if (!videoInfo) return null;

  const handleDownload = (height) => {
    // Generate the download link and prompt download in browser
    window.location.href = `http://localhost:5005/api/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(videoInfo.title || 'video')}&height=${height}`;
  };

  return (
    <div className="glass-panel">
      <div className="section-title">Download Options</div>
      
      <div className="format-list">
        {videoInfo.videoFormats.map((format, idx) => (
          <div key={`vid-${idx}`} className="format-item">
            <div className="format-info">
              <span className="quality-label">{format.qualityLabel} Video</span>
              <span className="type-label">Format: {format.type}</span>
            </div>
            <button 
              className="download-icon-btn" 
              onClick={() => handleDownload(format.height)}
              title="Download Video"
            >
              <Download size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadOptions;
