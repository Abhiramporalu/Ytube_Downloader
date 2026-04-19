require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Auto-fallback for Node 18 missing globals
if (!global.File) {
  global.File = require('buffer').File || class File {};
}

const ytdlPath = path.join(__dirname, 'yt-dlp');
let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch(e) {
  console.error("Warning: ffmpeg-static missing. Muxing high quality formats won't be possible.");
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve Static Assets from React Build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Temporary download directory to hold muxed files before serving
const tempDir = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

app.get('/api/info', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Fetch JSON info
    exec(`"${ytdlPath}" -J --no-playlist --no-warnings "${url}"`, { maxBuffer: 15 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            console.error('yt-dlp getInfo error:', error);
            return res.status(500).json({ error: 'Failed to extract video details or age-restricted.' });
        }
        
        try {
            const info = JSON.parse(stdout);
            
            let title = info.title;
            let thumbnail = Array.isArray(info.thumbnails) ? info.thumbnails[info.thumbnails.length - 1].url : info.thumbnail;
            let channel = info.channel || info.uploader;
            
            const videoFormats = [];
            
            if (info.formats) {
                // Collect unique video heights from ALL formats (using Set)
                const videoHeights = new Set();
                info.formats.forEach(f => {
                    if (f.vcodec !== 'none' && f.height) {
                        videoHeights.add(f.height);
                    }
                });

                // Add to array and sort descending
                const heightsArr = Array.from(videoHeights).sort((a,b) => b - a);
                heightsArr.forEach(h => {
                    let label = `${h}p High Quality`;
                    if (h >= 1080) label = `${h}p Premium (Requires Processing)`;
                    
                    videoFormats.push({
                        height: h,
                        qualityLabel: label,
                        type: 'mp4'
                    });
                });
                
                // Add default standard if none found
                if (videoFormats.length === 0) {
                     videoFormats.push({ height: 'best', qualityLabel: 'Best Quality', type: 'mp4' });
                }
            }

            res.json({ title, thumbnail, channel, videoFormats });
        } catch (err) {
            console.error('yt-dlp JSON parse error:', err);
            res.status(500).json({ error: 'Failed to parse video payload.' });
        }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to dispatch fetch command.' });
  }
});

app.get('/api/download', (req, res) => {
  let { url, height, title } = req.query;
  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  // Pre-clean title from frontend
  title = (title || 'video').trim().replace(/[^\w\s-\.]/gi, '_');

  const fileExt = 'mp4';
  const fileName = `${title}-${Date.now()}.${fileExt}`;
  const outputPath = path.join(tempDir, fileName);

  let formatFlag = '';
  if (!height || height === 'best' || height === 'undefined') {
      formatFlag = `bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
  } else {
      formatFlag = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
  }

  // Build yt-dlp arguments
  const args = [
      '-f', formatFlag,
      '--merge-output-format', fileExt,
      '-o', outputPath,
      '--no-playlist',
      '--no-warnings'
  ];

  // Add ffmpeg if available
  if (ffmpegPath) {
      args.push('--ffmpeg-location', ffmpegPath);
  }

  args.push(url);

  // Send headers instantly so the browser immediately initiates the download connection
  res.header('Content-Disposition', `attachment; filename="${title}.${fileExt}"`);
  res.header('Content-Type', `video/${fileExt}`);

  // Start downloading process
  const child = spawn(ytdlPath, args);
  
  child.stderr.on('data', data => console.log('Download Output:', data.toString()));
  
  child.on('close', code => {
      if (code === 0 && fs.existsSync(outputPath)) {
          console.log(`Download finished: ${outputPath}`);
          // Send the physical file
          res.sendFile(outputPath, (err) => {
              try {
                  fs.unlinkSync(outputPath);
              } catch(e) {
                  console.log('Error cleaning up file:', e);
              }
          });
      } else {
          // If we already sent headers we can't send 500 cleanly, so we end abruptly if fail
          res.end();
      }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
