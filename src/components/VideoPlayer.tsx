import React, { useState, useRef, useEffect } from 'react';
import '../styles/VideoPlayer.css';
import HLS from 'hls.js';

interface VideoPlayerProps {
  title: string;
  url: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ title, url, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HLS | null>(null);
  const mpegtsRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize player when URL changes
  useEffect(() => {
    if (!videoRef.current || !url) return;

    console.log('🎬 VideoPlayer: Loading URL:', url);
    setLoading(true);
    setError(null);

    try {
      // Check if this is a .ts stream (MPEG-TS)
      if (url.includes('.ts')) {
        console.log('📺 Detected MPEG-TS stream (.ts), using mpegts.js player');
        
        // Load mpegts.js from CDN
        if ((window as any).mpegts) {
          playWithMpegts(url);
        } else {
          // Load mpegts.js from CDN
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/mpegts.js@latest/dist/mpegts.js';
          script.onload = () => {
            playWithMpegts(url);
          };
          script.onerror = () => {
            console.warn('Failed to load mpegts.js, trying HLS.js fallback');
            playWithHLS(url);
          };
          document.head.appendChild(script);
        }
      } else if (url.includes('.m3u8')) {
        console.log('📺 Detected HLS stream (.m3u8), using HLS.js');
        playWithHLS(url);
      } else {
        console.log('📺 Direct stream, using native video element');
        playNative(url);
      }

      const handleCanPlay = () => {
        console.log('✅ Video ready to play');
        setLoading(false);
        videoRef.current?.play().catch(e => {
          console.log('Auto-play prevented:', e.message);
        });
      };

      const handleError = () => {
        const video = videoRef.current;
        if (!video || !video.error) return;
        
        const errorCodes: { [key: number]: string } = {
          1: 'MEDIA_ERR_ABORTED - Loading was aborted',
          2: 'MEDIA_ERR_NETWORK - Network error',
          3: 'MEDIA_ERR_DECODE - Decoding error (format not supported)',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Source not supported'
        };
        
        const errorMsg = errorCodes[video.error.code] || 'Unknown error';
        console.error('❌ Video Error:', errorMsg, video.error);
        setError(`Error loading stream: ${errorMsg}`);
        setLoading(false);
      };

      const handleLoadedMetadata = () => {
        console.log('📺 Metadata loaded, video duration:', videoRef.current?.duration);
      };

      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('error', handleError);
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleCanPlay);
          videoRef.current.removeEventListener('error', handleError);
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (mpegtsRef.current) {
          mpegtsRef.current.destroy();
          mpegtsRef.current = null;
        }
      };
    } catch (err) {
      console.error('❌ Error initializing player:', err);
      setError('Error initializing player');
      setLoading(false);
    }
  }, [url]);

  const playWithMpegts = (streamUrl: string) => {
    if (!videoRef.current) return;
    
    try {
      const mpegts = (window as any).mpegts;
      const player = mpegts.createPlayer({
        type: 'mse',
        isLive: true,
        url: streamUrl
      });
      
      mpegtsRef.current = player;
      player.attachMediaElement(videoRef.current);
      
      player.on(mpegts.Events.PLAYER_STATE_CHANGED, (state: string) => {
        console.log('🎬 MPEGTS Player state:', state);
        if (state === 'PLAYING') {
          setLoading(false);
        }
      });
      
      player.on(mpegts.Events.ERROR, (type: string, detail: any) => {
        console.error('❌ MPEGTS Error:', type, detail);
        setError(`Stream Error: ${type}`);
        setLoading(false);
      });
      
      player.load();
      player.play();
      console.log('✅ MPEGTS player initialized');
    } catch (err) {
      console.error('❌ MPEGTS error:', err);
      setError('Failed to play MPEG-TS stream');
      setLoading(false);
    }
  };

  const playWithHLS = (streamUrl: string) => {
    if (!videoRef.current) return;
    
    try {
      if (HLS.isSupported()) {
        const hls = new HLS();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(HLS.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed');
          setLoading(false);
          videoRef.current?.play().catch(e => {
            console.log('Auto-play prevented:', e.message);
          });
        });
        
        hls.on(HLS.Events.ERROR, (event, data) => {
          console.error('❌ HLS Error:', data);
          setError(`HLS Error: ${data.details || data.type}`);
          setLoading(false);
        });
      } else {
        playNative(streamUrl);
      }
    } catch (err) {
      console.error('❌ HLS error:', err);
      playNative(streamUrl);
    }
  };

  const playNative = (streamUrl: string) => {
    if (!videoRef.current) return;
    
    console.log('📺 Using native HTML5 video element');
    videoRef.current.src = streamUrl;
    videoRef.current.crossOrigin = 'anonymous';
  };

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
        <div className="player-close" onClick={onClose}>×</div>
        <div className="video-wrapper">
          {loading && !error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              zIndex: 1000
            }}>
              <div className="spinner"></div>
              <p>Loading stream...</p>
            </div>
          )}
          
          {error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              padding: '20px',
              borderRadius: '8px',
              zIndex: 1000,
              textAlign: 'center'
            }}>
              <p>❌ {error}</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>Check console for details</p>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="video-element"
            controls
            style={{ width: '100%', height: '100%' }}
          />
          
          <div className="video-title">{title}</div>
        </div>
      </div>
    </div>
  );
};
