import { useState, useEffect } from 'react';
import { fetchChannelEPG, EPGProgram } from '../api/index';
import '../styles/EPGDisplay.css';

interface EPGDisplayProps {
  channelId: string;
  channelName: string;
  onClose?: () => void;
}

export default function EPGDisplay({ channelId, channelName, onClose }: EPGDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<EPGProgram | null>(null);
  const [next, setNext] = useState<EPGProgram | null>(null);
  const [programs, setPrograms] = useState<EPGProgram[]>([]);

  useEffect(() => {
    loadEPG();
    // Refresh EPG every minute
    const interval = setInterval(loadEPG, 60000);
    return () => clearInterval(interval);
  }, [channelId]);

  const loadEPG = async () => {
    setLoading(true);
    try {
      const epgData = await fetchChannelEPG(channelId);
      setCurrent(epgData.current);
      setNext(epgData.next);
      setPrograms(epgData.programs);
    } catch (error) {
      console.error('Error loading EPG:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (start: number, stop: number) => {
    const minutes = Math.floor((stop - start) / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgress = (start: number, stop: number) => {
    const now = Date.now() / 1000;
    const total = stop - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  if (loading) {
    return (
      <div className="epg-display">
        <div className="epg-header">
          <h3>{channelName}</h3>
          {onClose && <button onClick={onClose} className="epg-close">✕</button>}
        </div>
        <div className="epg-loading">Loading EPG data...</div>
      </div>
    );
  }

  return (
    <div className="epg-display">
      <div className="epg-header">
        <h3>📺 {channelName}</h3>
        {onClose && <button onClick={onClose} className="epg-close">✕</button>}
      </div>

      {current && (
        <div className="epg-current">
          <div className="epg-badge">NOW PLAYING</div>
          <div className="epg-program-info">
            <h4>{current.name}</h4>
            <div className="epg-time">
              {formatTime(current.start_timestamp)} - {formatTime(current.stop_timestamp)}
              <span className="epg-duration">
                · {formatDuration(current.start_timestamp, current.stop_timestamp)}
              </span>
            </div>
            {current.descr && <p className="epg-description">{current.descr}</p>}
            <div className="epg-progress-bar">
              <div 
                className="epg-progress-fill" 
                style={{ width: `${getProgress(current.start_timestamp, current.stop_timestamp)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {next && (
        <div className="epg-next">
          <div className="epg-badge epg-badge-next">UP NEXT</div>
          <div className="epg-program-info">
            <h4>{next.name}</h4>
            <div className="epg-time">
              {formatTime(next.start_timestamp)} - {formatTime(next.stop_timestamp)}
              <span className="epg-duration">
                · {formatDuration(next.start_timestamp, next.stop_timestamp)}
              </span>
            </div>
            {next.descr && <p className="epg-description">{next.descr}</p>}
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div className="epg-schedule">
          <h4>Program Guide</h4>
          <div className="epg-program-list">
            {programs.slice(0, 10).map((program) => (
              <div key={program.id} className="epg-program-item">
                <div className="epg-program-time">
                  {formatTime(program.start_timestamp)}
                </div>
                <div className="epg-program-details">
                  <div className="epg-program-name">{program.name}</div>
                  <div className="epg-program-duration">
                    {formatDuration(program.start_timestamp, program.stop_timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!current && !next && programs.length === 0 && (
        <div className="epg-no-data">
          <p>No EPG data available for this channel</p>
        </div>
      )}
    </div>
  );
}
