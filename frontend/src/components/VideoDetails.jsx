import React from 'react';
import { DownloadCloud } from 'lucide-react';

const VideoDetails = ({ videoInfo }) => {
  if (!videoInfo) return null;

  return (
    <div className="glass-panel">
      <div className="section-title">Video Information</div>
      <div className="thumbnail-container">
        <img src={videoInfo.thumbnail} alt={videoInfo.title} />
      </div>
      <h2 className="video-title">{videoInfo.title}</h2>
      <p className="video-channel">Channel: {videoInfo.channel}</p>
    </div>
  );
};

export default VideoDetails;
