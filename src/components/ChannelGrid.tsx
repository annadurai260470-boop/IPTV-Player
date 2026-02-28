import React, { useState } from 'react';
import '../styles/ChannelGrid.css';
import { Channel, VODItem, Episode } from '../types/index';

interface ChannelGridProps {
  channels?: Channel[];
  vod?: VODItem[];
  onSelectChannel?: (channel: Channel) => void;
  onSelectVOD?: (item: VODItem) => void;
  onSelectEpisode?: (episode: Episode, vodTitle: string) => void;
  type: 'channels' | 'vod';
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels = [],
  vod = [],
  onSelectChannel,
  onSelectVOD,
  onSelectEpisode,
  type
}) => {
  const [expandedItems, setExpandedItems] = useState<string | null>(null);

  // Debug logging
  React.useEffect(() => {
    if (type === 'channels') {
      console.log('🔍 ChannelGrid channels prop updated:', {
        channelsLength: channels.length,
        firstChannel: channels[0],
        allChannels: channels
      });
    }
  }, [channels, type]);

  return (
    <div className="channel-grid">
      {type === 'channels' && channels.length > 0 && (
        <div className="grid-container">
          {channels.map((channel, index) => {
            // Categories have 'title' field, channels have 'name' field
            const displayTitle = channel.name || channel.title || `Channel ${index}`;
            const displayId = channel.id || `test-${index}`;
            
            // Test: Different color for each item
            const testColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
            const bgColor = testColors[index % testColors.length];
            
            console.log(`🎬 Rendering Channel ${index}:`, {
              channelName: channel.name,
              displayTitle,
              displayId,
              hasTitle: !!channel.title,
              hasName: !!channel.name,
              hasIcon: !!channel.icon,
              hasPoster: !!channel.poster,
              channel_id_value: channel.id,
              channel_title_value: channel.title
            });
            
            return (
              <div
                key={displayId}
                className="grid-item channel-item"
                onClick={() => onSelectChannel?.(channel)}
                style={{ cursor: 'pointer', minHeight: '220px' }}
              >
                <div className="item-image" style={{ backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {channel.icon || channel.poster ? (
                    <img
                      src={channel.icon || channel.poster}
                      alt={displayTitle}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#fff', padding: '10px', fontWeight: 'bold' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📺</div>
                      <div style={{ fontSize: '12px', wordBreak: 'break-word' }}>{displayTitle}</div>
                    </div>
                  )}
                </div>
                <div className="item-title" style={{ minHeight: '40px', fontWeight: 'bold', fontSize: '14px' }}>{displayTitle}</div>
              </div>
            );
          })}
        </div>
      )}

      {type === 'vod' && vod.length > 0 && (
        <div className="grid-container">
          {vod.map((item) => (
            <div key={item.id} className="vod-container">
              <div
                className={`grid-item vod-item ${item.episodes ? 'series-item' : 'movie-item'}`}
                onClick={() => {
                  if (item.episodes && item.episodes.length > 0) {
                    // Series with episodes - toggle expansion
                    setExpandedItems(expandedItems === item.id ? null : item.id);
                  } else {
                    // Direct movie or single content
                    onSelectVOD?.(item);
                  }
                }}
              >
                <div className="item-image">
                  <img
                    src={item.poster || 'https://via.placeholder.com/200?text=VOD'}
                    alt={item.title}
                    loading="lazy"
                  />
                  {!item.episodes && <div className="play-overlay">▶</div>}
                </div>
                <div className="item-title">{item.title}</div>
              </div>
              {item.episodes && expandedItems === item.id && (
                <div className="episodes-list">
                  {item.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="episode-item"
                      onClick={() =>
                        onSelectEpisode?.(episode, item.title)
                      }
                    >
                      <span className="episode-number">
                        Ep {episode.id}
                      </span>
                      <span className="episode-title">{episode.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {((type === 'channels' && channels.length === 0) ||
        (type === 'vod' && vod.length === 0)) && (
        <div className="empty-state">
          <p>No {type === 'vod' ? 'VOD content' : 'channels'} available</p>
          <p style={{ fontSize: '0.9em', color: '#999', marginTop: '10px' }}>
            {type === 'channels' ? 'Click to load channels data...' : 'Loading VOD data...'}
          </p>
        </div>
      )}
    </div>
  );
};


