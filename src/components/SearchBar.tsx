import { useState } from 'react';
import { searchContent, SearchResults, createStreamLink, fetchSeriesSeasons, fetchSeriesEpisodes, fetchEpisodeDetails } from '../api/index';
import { Channel, VODItem } from '../types/index';
import '../styles/SearchBar.css';
import { t, tc } from '../i18n';

interface SearchBarProps {
  onResultsFound?: (results: SearchResults) => void;
  onPlayContent?: (item: { title: string; url: string }) => void;
}

export default function SearchBar({ onResultsFound, onPlayContent }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loadingItem, setLoadingItem] = useState<string | number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<VODItem | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [showSeasons, setShowSeasons] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [showEpisodes, setShowEpisodes] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) {
      alert(t('search_min_chars'));
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchContent(query, 'all');
      setResults(searchResults);
      setShowResults(true);
      
      if (onResultsFound) {
        onResultsFound(searchResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const closeResults = () => {
    setShowResults(false);
  };

  const handleChannelClick = async (channel: Channel) => {
    console.log('🔍 Selected channel:', channel);
    
    if (!channel.cmd) {
      alert(t('err_no_channel_stream'));
      return;
    }

    setLoadingItem(channel.id);
    try {
      const streamUrl = await createStreamLink(channel.cmd);
      if (streamUrl && onPlayContent) {
        closeResults();
        onPlayContent({
          title: channel.name,
          url: streamUrl
        });
      } else {
        alert(t('err_stream_failed'));
      }
    } catch (error) {
      console.error('Error playing channel:', error);
      alert(t('err_channel_play'));
    } finally {
      setLoadingItem(null);
    }
  };

  const handleVODClick = async (item: VODItem) => {
    console.log('🔍 Selected VOD item:', item);
    
    // Check if it's a series
    const isSeries = (item as any).is_series === 1 || (item as any).is_series === '1';
    
    if (isSeries) {
      alert(t('err_series_navigate'));
      return;
    }

    // It's a movie - try to play it
    if (!item.cmd && !(item as any).cmd) {
      alert(t('err_no_movie_stream'));
      return;
    }

    setLoadingItem(item.id);
    try {
      const cmd = item.cmd || (item as any).cmd;
      const streamUrl = await createStreamLink(cmd);
      if (streamUrl && onPlayContent) {
        closeResults();
        onPlayContent({
          title: item.name,
          url: streamUrl
        });
      } else {
        alert(t('err_stream_failed'));
      }
    } catch (error) {
      console.error('Error playing movie:', error);
      alert(t('err_movie_play'));
    } finally {
      setLoadingItem(null);
    }
  };

  const handleSeriesClick = async (item: VODItem) => {
    console.log('🔍 Selected series FULL OBJECT:', JSON.stringify(item, null, 2));
    console.log('🔍 Series ID (item.id):', item.id);
    console.log('🔍 Series video_id:', (item as any).video_id);
    console.log('🔍 Category ID:', (item as any).category_id);
    
    // Series items use `id` as the series ID (same field portal returns)
    const seriesId = item.id || (item as any).video_id || (item as any).series_id;
    console.log(`📡 Will call /series/${seriesId}/seasons with movie_id=${seriesId}:${seriesId}`);
    
    if (!seriesId || seriesId === '0' || seriesId === 0) {
      console.error('❌ Series ID is 0 or undefined!');
      alert(t('err_series_id_invalid'));
      return;
    }
    
    setLoadingItem(item.id);
    try {
      const categoryId = (item as any).category_id || '*';
      console.log(`📡 Calling fetchSeriesSeasons with seriesId=${seriesId}, categoryId=${categoryId}`);
      
      const seasonsData = await fetchSeriesSeasons(String(seriesId), categoryId);
      
      if (seasonsData && seasonsData.length > 0) {
        console.log(`✅ Loaded ${seasonsData.length} seasons`);
        setSelectedSeries(item);
        setSeasons(seasonsData);
        setShowSeasons(true);
        setShowResults(false); // Close search results
      } else {
        alert(`${t('err_no_seasons')}: "${item.name}"`);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      alert(t('err_seasons_failed'));
    } finally {
      setLoadingItem(null);
    }
  };

  const closeSeasons = () => {
    setShowSeasons(false);
    setSelectedSeries(null);
    setSeasons([]);
  };

  const closeEpisodes = () => {
    setShowEpisodes(false);
    setSelectedSeason(null);
    setEpisodes([]);
  };

  const handleSeasonClick = async (season: any) => {
    console.log('🎬 Selected season:', season);
    
    if (!selectedSeries) {
      alert(t('err_series_info_na'));
      return;
    }

    setLoadingItem(season.id);
    try {
      const categoryId = (selectedSeries as any).category_id || '*';
      const seriesId = selectedSeries.id;
      const seasonId = season.id;
      
      console.log(`📡 Fetching episodes for series ${seriesId}, season ${seasonId}`);
      
      const episodesData = await fetchSeriesEpisodes(seriesId, seasonId, categoryId);
      
      if (episodesData && episodesData.length > 0) {
        console.log(`✅ Loaded ${episodesData.length} episodes`);
        setSelectedSeason(season);
        setEpisodes(episodesData);
        setShowEpisodes(true);
        setShowSeasons(false); // Close seasons modal
      } else {
        alert(t('err_no_episodes_season'));
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
      alert(t('err_episodes_failed'));
    } finally {
      setLoadingItem(null);
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`🔍 ${t('search_placeholder')}`}
          className="search-input"
          disabled={isSearching}
        />
        <button 
          onClick={handleSearch} 
          className="search-button"
          disabled={isSearching || query.length < 2}
        >
          {isSearching ? '⏳' : '🔍'}
        </button>
      </div>

      {showResults && results && (
        <div className="search-results-overlay" onClick={closeResults}>
          <div className="search-results-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-results-header">
              <h2>"{results.query}" {t('search_results_for')}</h2>
              <button className="close-button" onClick={closeResults}>✕</button>
            </div>
            
            <div className="search-results-content">
              <div className="search-results-summary">
                {results.totalResults} {t('found')}
              </div>

              {results.results.channels.length > 0 && (
                <div className="search-section">
                  <h3>📺 {t('search_channels')} ({results.results.channels.length})</h3>
                  <div className="search-results-grid">
                    {results.results.channels.slice(0, 10).map((channel) => (
                      <div 
                        key={channel.id} 
                        className={`search-result-item ${loadingItem === channel.id ? 'loading' : ''}`}
                        onClick={() => handleChannelClick(channel)}
                      >
                        {loadingItem === channel.id ? (
                          <div className="search-result-icon loading-spinner">⏳</div>
                        ) : (
                          <div className="search-result-icon">📡</div>
                        )}
                        <div className="search-result-info">
                          <div className="search-result-name">{channel.name}</div>
                          <div className="search-result-meta">
                            {loadingItem === channel.id ? t('loading_ellipsis') : `சேனல் #${channel.number}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.results.vod.length > 0 && (
                <div className="search-section">
                  <h3>🎬 {t('search_movies')} ({results.results.vod.length})</h3>
                  <div className="search-results-grid">
                    {results.results.vod.slice(0, 10).map((item) => (
                      <div 
                        key={item.id} 
                        className={`search-result-item ${loadingItem === item.id ? 'loading' : ''}`}
                        onClick={() => handleVODClick(item)}
                      >
                        {loadingItem === item.id ? (
                          <div className="search-result-icon loading-spinner">⏳</div>
                        ) : item.poster || (item as any).screenshot_uri ? (
                          <img 
                            src={item.poster || (item as any).screenshot_uri} 
                            alt={item.name} 
                            className="search-result-poster" 
                          />
                        ) : (
                          <div className="search-result-icon">🎬</div>
                        )}
                        <div className="search-result-info">
                          <div className="search-result-name">{item.name}</div>
                          <div className="search-result-meta">
                            {loadingItem === item.id ? t('loading_ellipsis') : (item.year || '')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.results.series.length > 0 && (
                <div className="search-section">
                  <h3>📺 {t('search_series')} ({results.results.series.length})</h3>
                  <div className="search-results-grid">
                    {results.results.series.slice(0, 10).map((item) => (
                      <div 
                        key={item.id} 
                        className={`search-result-item ${loadingItem === item.id ? 'loading' : ''}`}
                        onClick={() => handleSeriesClick(item)}
                      >
                        {loadingItem === item.id ? (
                          <div className="loading-spinner">⏳</div>
                        ) : item.poster || (item as any).screenshot_uri ? (
                          <img 
                            src={item.poster || (item as any).screenshot_uri} 
                            alt={item.name} 
                            className="search-result-poster" 
                          />
                        ) : (
                          <div className="search-result-icon">📺</div>
                        )}
                        <div className="search-result-info">
                          <div className="search-result-name">{item.name}</div>
                          <div className="search-result-meta">
                            {loadingItem === item.id ? t('loading_seasons') : (item.year || '')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.totalResults === 0 && (
                <div className="no-results">
                  <p>"{results.query}" {t('search_no_results')}</p>
                  <p>வேறு சொல்லை முயற்சிக்கவும்</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSeasons && selectedSeries && (
        <div className="search-results-overlay" onClick={closeSeasons}>
          <div className="search-results-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-results-header">
              <h2>📺 {selectedSeries.name} - {t('seasons')}</h2>
              <button className="close-button" onClick={closeSeasons}>✕</button>
            </div>
            
            <div className="search-results-content">
              <div className="search-results-summary">
                {tc(seasons.length, 'season')} {t('found')}
              </div>

              <div className="search-section">
                <div className="search-results-grid">
                  {seasons.map((season: any, index: number) => (
                    <div 
                      key={season.id || index} 
                      className={`search-result-item ${loadingItem === season.id ? 'loading' : ''}`}
                      onClick={() => handleSeasonClick(season)}
                    >
                      {loadingItem === season.id ? (
                        <div className="loading-spinner">⏳</div>
                      ) : season.screenshot_uri || season.cover_big ? (
                        <img 
                          src={season.screenshot_uri || season.cover_big} 
                          alt={season.name || `${t('unnamed_season')} ${index + 1}`} 
                          className="search-result-poster" 
                        />
                      ) : (
                        <div className="search-result-icon">📺</div>
                      )}
                      <div className="search-result-info">
                        <div className="search-result-name">
                          {season.series || season.name || `${t('unnamed_season')} ${index + 1}`}
                        </div>
                        {season.o_name && (
                          <div className="search-result-meta">
                            {loadingItem === season.id ? t('loading_episodes') : season.o_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {seasons.length === 0 && (
                <div className="no-results">
                  <p>சீசன்கள் ஏதுமில்லை</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEpisodes && selectedSeries && selectedSeason && (
        <div className="search-results-overlay" onClick={closeEpisodes}>
          <div className="search-results-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-results-header">
              <h2>🎬 {selectedSeries.name} - {selectedSeason.series || selectedSeason.name || t('episodes')}</h2>
              <button className="close-button" onClick={closeEpisodes}>✕</button>
            </div>
            
            <div className="search-results-content">
              <div className="search-results-summary">
                {tc(episodes.length, 'episode')} {t('found')}
              </div>

              <div className="search-section">
                <div className="search-results-grid">
                  {episodes.map((episode: any, index: number) => (
                    <div 
                      key={episode.id || index} 
                      className={`search-result-item ${loadingItem === episode.id ? 'loading' : ''}`}
                      onClick={async () => {
                        if (!selectedSeries || !selectedSeason) {
                        alert(t('err_season_info_na'));
                          return;
                        }

                        console.log('🎬 Clicked episode:', episode);
                        setLoadingItem(episode.id);
                        
                        try {
                          const categoryId = (selectedSeries as any).category_id || '*';
                          const seriesId = selectedSeries.id;
                          const seasonId = selectedSeason.id;
                          const episodeId = episode.id;
                          
                          console.log(`📡 Fetching episode details: series=${seriesId}, season=${seasonId}, episode=${episodeId}`);
                          
                          // Fetch episode details to get the cmd
                          const episodeDetails = await fetchEpisodeDetails(seriesId, seasonId, episodeId, categoryId);
                          
                          if (!episodeDetails) {
                            alert(t('err_episode_details'));
                            return;
                          }
                          
                          console.log('📦 Episode details:', episodeDetails);
                          
                          const cmd = episodeDetails.cmd || episodeDetails.commands;
                          if (!cmd) {
                            alert(t('err_episode_stream_na'));
                            return;
                          }
                          
                          console.log('🎮 Creating stream link with cmd:', cmd);
                          const streamUrl = await createStreamLink(cmd);
                          
                          if (streamUrl && onPlayContent) {
                            console.log('✅ Stream URL created:', streamUrl);
                            closeEpisodes();
                            onPlayContent({
                              title: `${selectedSeries.name} - ${episode.name || `${t('unnamed_episode')} ${index + 1}`}`,
                              url: streamUrl
                            });
                          } else {
                            alert('நேரோடை உருவாக்க தோல்வியுற்றது');
                          }
                        } catch (error) {
                          console.error('Error playing episode:', error);
                          alert('அத்தியாயம் இயக்க தோல்வியுற்றது');
                        } finally {
                          setLoadingItem(null);
                        }
                      }}
                    >
                      {loadingItem === episode.id ? (
                        <div className="loading-spinner">⏳</div>
                      ) : episode.screenshot_uri || episode.cover_big ? (
                        <img 
                          src={episode.screenshot_uri || episode.cover_big} 
                          alt={episode.name || `${t('unnamed_episode')} ${index + 1}`} 
                          className="search-result-poster" 
                        />
                      ) : (
                        <div className="search-result-icon">🎬</div>
                      )}
                      <div className="search-result-info">
                        <div className="search-result-name">
                          {episode.name || `${t('unnamed_episode')} ${index + 1}`}
                        </div>
                        {episode.o_name && (
                          <div className="search-result-meta">
                            {loadingItem === episode.id ? t('loading_ellipsis') : episode.o_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {episodes.length === 0 && (
                <div className="no-results">
                  <p>No episodes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
