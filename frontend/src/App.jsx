import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import VideoDetails from './components/VideoDetails';
import DownloadOptions from './components/DownloadOptions';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);

  const fetchVideoInfo = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await axios.get(`http://localhost:5005/api/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch video details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="title-glow">Ytube Downloader</h1>
      
      <form className="input-group" onSubmit={fetchVideoInfo}>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="Paste YouTube Video URL here..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="neon-btn" disabled={loading || !url}>
          {loading ? <Loader2 className="spinner" size={20} /> : <Search size={20} />}
          <span>{loading ? 'Analyzing...' : 'Fetch Info'}</span>
        </button>
      </form>

      {error && (
        <div className="glass-panel" style={{ borderColor: 'var(--neon-accent)', color: 'var(--neon-accent)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={24} />
          {error}
        </div>
      )}

      {videoInfo && (
        <div className="content-grid">
          <VideoDetails videoInfo={videoInfo} />
          <DownloadOptions videoInfo={videoInfo} url={url} />
        </div>
      )}
    </>
  );
}

export default App;
