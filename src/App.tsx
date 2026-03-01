import './App.css'
import './styles/SearchBar.css'
import React, { useState, useEffect } from 'react'
import { ChannelGrid } from './components/ChannelGrid'
import { VideoPlayer } from './components/VideoPlayer'
import SearchBar from './components/SearchBar'
import { useFavorites, FavoriteItem } from './hooks/useFavorites'
import { useWatchHistory } from './hooks/useWatchHistory'
import { fetchChannelCategories, fetchChannelsByCategory, fetchVOD, fetchSeries, fetchVODByCategory, fetchSeriesByCategory, createStreamLink, fetchSeriesSeasons, fetchSeriesEpisodes, fetchEpisodeDetails } from './api/index'
import { Channel, VODItem, Episode } from './types/index'

function App() {
  const [activeTab, setActiveTab] = useState<'channels' | 'movies' | 'series' | 'favorites'>('movies')
  const { favorites, isFavorite, toggleFavorite, clearFavorites } = useFavorites()
  const { history, addToHistory, removeFromHistory, clearHistory } = useWatchHistory()
  const [channelCategories, setChannelCategories] = useState<Channel[]>([])
  const [selectedChannelCategory, setSelectedChannelCategory] = useState<Channel | null>(null)
  const [channelsInCategory, setChannelsInCategory] = useState<Channel[]>([])
  const [vodContent, setVodContent] = useState<VODItem[]>([])
  const [seriesContent, setSeriesContent] = useState<VODItem[]>([])
  const [selectedVODCategory, setSelectedVODCategory] = useState<VODItem | null>(null)
  const [vodItemsInCategory, setVodItemsInCategory] = useState<VODItem[]>([])
  const [loading, setLoading] = useState(true)
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [vodLoading, setVodLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ title: string; url: string } | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<VODItem | null>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [showSeasons, setShowSeasons] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<any>(null)
  const [episodes, setEpisodes] = useState<any[]>([])
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | number | null>(null)

  // Load VOD and Series on initial mount
  useEffect(() => {
    loadVOD()
    loadSeries()
  }, [])

  // Load channel categories when tab is switched to channels
  useEffect(() => {
    if (activeTab === 'channels' && channelCategories.length === 0 && !selectedChannelCategory) {
      loadChannelCategories()
    }
  }, [activeTab])

  const handleTabChange = (tab: 'channels' | 'movies' | 'series' | 'favorites') => {
    setActiveTab(tab)
    if (tab === 'channels') {
      handleBackToVODCategories()
    } else {
      handleBackToChannelCategories()
    }
  }

  const loadVOD = async () => {
    setLoading(true)
    try {
      const vodData = await fetchVOD()
      console.log('🎬 Movies data loaded:', vodData.length, 'categories')
      setVodContent(vodData)
    } catch (error) {
      console.error('Error loading VOD content:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSeries = async () => {
    try {
      const seriesData = await fetchSeries()
      console.log('📺 Series data loaded:', seriesData.length, 'categories')
      setSeriesContent(seriesData)
    } catch (error) {
      console.error('Error loading Series content:', error)
    }
  }

  const loadChannelCategories = async () => {
    setChannelsLoading(true)
    try {
      const categoriesData = await fetchChannelCategories()
      console.log('✅ Raw categoriesData from API:', categoriesData)
      console.log('✅ Is array?', Array.isArray(categoriesData))
      console.log('✅ Length:', categoriesData.length)
      console.log('✅ Number of categories:', categoriesData.length)
      if (categoriesData.length > 0) {
        console.log('📝 First category:', JSON.stringify(categoriesData[0]))
        console.log('📝 First category title:', categoriesData[0].title)
        console.log('📝 First category name:', categoriesData[0].name)
      }
      console.log('✅ Setting channelCategories state to:', categoriesData)
      setChannelCategories(categoriesData)
    } catch (error) {
      console.error('Error loading channel categories:', error)
    } finally {
      setChannelsLoading(false)
    }
  }

  const loadChannelsForCategory = async (category: Channel) => {
    setChannelsLoading(true)
    setSelectedChannelCategory(category)
    try {
      const categoryId = typeof category.id === 'string' ? category.id : String(category.id)
      const channelsData = await fetchChannelsByCategory(categoryId)
      const categoryTitle = category.title || category.name || 'Channel'
      console.log(`Channels for category ${categoryTitle}:`, channelsData)
      setChannelsInCategory(channelsData)
    } catch (error) {
      console.error('Error loading channels for category:', error)
    } finally {
      setChannelsLoading(false)
    }
  }

  const handleSelectChannelCategory = (category: Channel) => {
    loadChannelsForCategory(category)
  }

  const handleBackToChannelCategories = () => {
    setSelectedChannelCategory(null)
    setChannelsInCategory([])
  }

  const loadVODItemsForCategory = async (category: VODItem) => {
    setVodLoading(true)
    setSelectedVODCategory(category)
    try {
      const categoryId = typeof category.id === 'string' ? category.id : String(category.id)
      const categoryTitle = category.name || category.title || 'Category'
      
      // Determine if this is a series or movie category based on active tab
      const isSeries = activeTab === 'series';
      const items = isSeries 
        ? await fetchSeriesByCategory(categoryId)
        : await fetchVODByCategory(categoryId);
      
      console.log(`${isSeries ? '📺 Series' : '🎬 Movies'} items for category ${categoryTitle}:`, items.length)
      
      if (items.length > 0) {
        console.log('🖼️ First item image data:', {
          poster: items[0].poster,
          screenshot_uri: items[0].screenshot_uri,
          cover_big: items[0].cover_big,
          img: items[0].img
        });
      }
      setVodItemsInCategory(items)
    } catch (error) {
      console.error('Error loading items for category:', error)
    } finally {
      setVodLoading(false)
    }
  }

  const handleSelectVODCategory = (item: VODItem) => {
    loadVODItemsForCategory(item)
  }

  const handleBackToVODCategories = () => {
    setSelectedVODCategory(null)
    setVodItemsInCategory([])
  }

  const handleSelectChannel = (channel: Channel) => {
    // If this is a category (no cmd), load channels for it
    // Otherwise, it's a channel to play - create stream link
    if (!channel.cmd) {
      handleSelectChannelCategory(channel)
    } else {
      playChannel(channel)
    }
  }

  const playChannel = async (channel: Channel) => {
    const channelTitle = channel.name || channel.title || 'Channel'
    if (!channel.cmd) return
    const streamUrl = await createStreamLink(channel.cmd)
    if (streamUrl) {
      setSelectedItem({ title: channelTitle, url: streamUrl })
      addToHistory({
        id: `ch-${channel.id}`,
        title: channelTitle,
        image: channel.logo || channel.icon || channel.poster || '',
        type: 'channel',
        url: streamUrl,
      })
    }
  }

  const handleSelectVOD = async (item: VODItem) => {
    // If we are in the series tab AND already inside a category (items visible),
    // clicking a series item = show its seasons (NOT treat it as a nested category)
    if (activeTab === 'series' && selectedVODCategory !== null) {
      await handleSeriesClick(item)
      return
    }

    // If no cmd, it's a category row — load its items
    if (!item.cmd) {
      handleSelectVODCategory(item)
      return
    }

    // Has cmd — it's an actual movie/episode, play it
    playVODItem(item)
  }

  const handleSeriesClick = async (item: VODItem) => {
    console.log('🎬 handleSeriesClick called with:', { id: item.id, video_id: (item as any).video_id, name: item.name })

    // Series items from category listing use `id` as the series ID
    // video_id is sometimes the same, sometimes absent — prefer id
    const seriesId = item.id || (item as any).video_id || (item as any).series_id
    console.log(`📡 Will call /series/${seriesId}/seasons with movie_id=${seriesId}:${seriesId}`)

    if (!seriesId || seriesId === '0' || seriesId === 0) {
      console.error('❌ Series ID is invalid:', seriesId)
      alert('Series ID not found or invalid')
      return
    }

    setLoadingItem(item.id)
    try {
      const categoryId = (item as any).category_id || '*'
      const seasonsData = await fetchSeriesSeasons(String(seriesId), categoryId)
      
      if (seasonsData && seasonsData.length > 0) {
        console.log(`✅ Loaded ${seasonsData.length} seasons`)
        setSelectedSeries(item)
        setSeasons(seasonsData)
        setShowSeasons(true)
      } else {
        alert(`No seasons found for "${item.name}"`)
      }
    } catch (error) {
      console.error('Error fetching seasons:', error)
      alert('Failed to load seasons')
    } finally {
      setLoadingItem(null)
    }
  }

  const handleSeasonClick = async (season: any) => {
    if (!selectedSeries) return
    
    setLoadingItem(season.id)
    try {
      const categoryId = (selectedSeries as any).category_id || '*'
      const seriesId = selectedSeries.id
      const seasonId = season.id
      
      const episodesData = await fetchSeriesEpisodes(seriesId, seasonId, categoryId)
      
      if (episodesData && episodesData.length > 0) {
        setSelectedSeason(season)
        setEpisodes(episodesData)
        setShowEpisodes(true)
        setShowSeasons(false)
      } else {
        alert('No episodes found for this season')
      }
    } catch (error) {
      console.error('Error fetching episodes:', error)
      alert('Failed to load episodes')
    } finally {
      setLoadingItem(null)
    }
  }

  const handleEpisodeClick = async (episode: any) => {
    if (!selectedSeries || !selectedSeason) return
    
    setLoadingItem(episode.id)
    try {
      const categoryId = (selectedSeries as any).category_id || '*'
      const seriesId = selectedSeries.id
      const seasonId = selectedSeason.id
      const episodeId = episode.id
      
      const episodeDetails = await fetchEpisodeDetails(seriesId, seasonId, episodeId, categoryId)
      
      if (!episodeDetails) {
        alert('Failed to load episode details')
        return
      }
      
      const cmd = episodeDetails.cmd || episodeDetails.commands
      if (!cmd) {
        alert('Episode stream URL not available')
        return
      }
      
      const streamUrl = await createStreamLink(cmd)
      
      if (streamUrl) {
        setShowEpisodes(false)
        setSelectedItem({
          title: `${selectedSeries.name} - ${episode.name}`,
          url: streamUrl
        })
      } else {
        alert('Failed to create stream link')
      }
    } catch (error) {
      console.error('Error playing episode:', error)
      alert('Failed to play episode')
    } finally {
      setLoadingItem(null)
    }
  }

  const playVODItem = async (item: VODItem) => {
    const itemTitle = item.name || item.title || 'Untitled'
    if (!item.cmd) return
    const streamUrl = await createStreamLink(item.cmd)
    if (streamUrl) {
      setSelectedItem({ title: itemTitle, url: streamUrl })
      addToHistory({
        id: `vod-${item.id}`,
        title: itemTitle,
        image: item.poster || item.screenshot_uri || item.cover_big || '',
        type: activeTab === 'series' ? 'series' : 'movie',
        url: streamUrl,
      })
    }
  }

  const handleSelectEpisode = (episode: Episode, vodTitle: string) => {
    setSelectedItem({
      title: `${vodTitle} - ${episode.title}`,
      url: episode.url
    })
  }

  const playVODItemByFav = async (fav: FavoriteItem) => {
    if (!fav.cmd) return
    const streamUrl = await createStreamLink(fav.cmd)
    if (streamUrl) {
      setSelectedItem({ title: fav.title, url: streamUrl })
      addToHistory({ id: fav.id, title: fav.title, image: fav.image, type: fav.type, url: streamUrl })
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">▶</span>
            <h1>IPTV Player</h1>
          </div>
          <nav className="nav-tabs">
            <button
              className={`tab-button ${activeTab === 'channels' ? 'active' : ''}`}
              onClick={() => handleTabChange('channels')}
            >
              📡 Channels
            </button>
            <button
              className={`tab-button ${activeTab === 'movies' ? 'active' : ''}`}
              onClick={() => handleTabChange('movies')}
            >
              🎬 Movies
            </button>
            <button
              className={`tab-button ${activeTab === 'series' ? 'active' : ''}`}
              onClick={() => handleTabChange('series')}
            >
              📺 Series
            </button>
            <button
              className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => handleTabChange('favorites')}
            >
              ❤️ Favourites {favorites.length > 0 && <span className="tab-badge">{favorites.length}</span>}
            </button>
          </nav>
          <div className="header-search">
            <SearchBar
              onResultsFound={() => {}}
              onPlayContent={(item) => setSelectedItem(item)}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ── Continue Watching ── */}
        {history.length > 0 && activeTab !== 'favorites' && (
          <div className="continue-watching">
            <div className="section-row-header">
              <h2 className="section-row-title">🕐 Continue Watching</h2>
              <button className="clear-history-btn" onClick={clearHistory}>Clear all</button>
            </div>
            <div className="cw-scroll">
              {history.map(h => (
                <div key={h.id} className="cw-card"
                  onClick={() => setSelectedItem({ title: h.title, url: h.url })}>
                  <div className="cw-thumb">
                    {h.image
                      ? <img src={h.image} alt={h.title} loading="lazy" />
                      : <div className="cw-thumb-fallback">{h.type === 'channel' ? '📡' : h.type === 'series' ? '📺' : '🎬'}</div>
                    }
                    <div className="cw-progress">
                      <div className="cw-progress-fill" style={{ width: `${h.progress ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="cw-info">
                    <div className="cw-title">{h.title}</div>
                    <div className="cw-meta">{new Date(h.watchedAt).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</div>
                  </div>
                  <button className="cw-remove" onClick={e => { e.stopPropagation(); removeFromHistory(h.id) }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {(loading && (activeTab === 'movies' || activeTab === 'series')) || (channelsLoading && activeTab === 'channels') || vodLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading {activeTab === 'channels' ? 'channels' : vodLoading ? 'content' : activeTab}...</p>
          </div>
        ) : (
          <>
            {activeTab === 'channels' && (
              <>
                {selectedChannelCategory && (
                  <div className="section-header">
                    <button className="back-btn" onClick={handleBackToChannelCategories}>← Back</button>
                    <h2 className="section-title">{selectedChannelCategory.title || selectedChannelCategory.name}</h2>
                  </div>
                )}
                <ChannelGrid
                  channels={selectedChannelCategory ? channelsInCategory : channelCategories}
                  onSelectChannel={selectedChannelCategory ? handleSelectChannel : handleSelectChannelCategory}
                  type="channels"
                  isCategory={!selectedChannelCategory}
                  categoryType="channels"
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  showSortControls={!!selectedChannelCategory}
                />
              </>
            )}
            {activeTab === 'movies' && (
              <>
                {selectedVODCategory && (
                  <div className="section-header">
                    <button className="back-btn" onClick={handleBackToVODCategories}>← Back</button>
                    <h2 className="section-title">{selectedVODCategory.name || selectedVODCategory.title}</h2>
                  </div>
                )}
                <ChannelGrid
                  vod={selectedVODCategory ? vodItemsInCategory : vodContent}
                  onSelectVOD={handleSelectVOD}
                  onSelectEpisode={handleSelectEpisode}
                  type="vod"
                  isCategory={!selectedVODCategory}
                  categoryType="movies"
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  showSortControls={!!selectedVODCategory}
                />
              </>
            )}
            {activeTab === 'series' && (
              <>
                {selectedVODCategory && (
                  <div className="section-header">
                    <button className="back-btn" onClick={handleBackToVODCategories}>← Back</button>
                    <h2 className="section-title">{selectedVODCategory.name || selectedVODCategory.title}</h2>
                  </div>
                )}
                <ChannelGrid
                  vod={selectedVODCategory ? vodItemsInCategory : seriesContent}
                  onSelectVOD={handleSelectVOD}
                  onSelectEpisode={handleSelectEpisode}
                  type="vod"
                  isCategory={!selectedVODCategory}
                  categoryType="series"
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  showSortControls={!!selectedVODCategory}
                />
              </>
            )}
            {activeTab === 'favorites' && (
              <>
                <div className="section-header" style={{ justifyContent: 'space-between' }}>
                  <h2 className="section-title">❤️ My Favourites</h2>
                  {favorites.length > 0 && (
                    <button className="clear-history-btn" onClick={clearFavorites}>Clear all</button>
                  )}
                </div>
                <ChannelGrid
                  vod={favorites.map(f => ({ id: f.id, name: f.title, poster: f.image, cmd: f.cmd } as VODItem))}
                  onSelectVOD={(item) => {
                    const fav = favorites.find(f => f.id === String(item.id))
                    if (fav?.cmd) playVODItemByFav(fav)
                  }}
                  type="vod"
                  isCategory={false}
                  categoryType="favorites"
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  showSortControls={favorites.length > 1}
                />
              </>
            )}
          </>
        )}
      </main>

      {selectedItem && (
        <VideoPlayer
          title={selectedItem.title}
          url={selectedItem.url}
          onClose={() => setSelectedItem(null)}
          onProgress={(pct) => {
            const h = history.find(x => x.title === selectedItem.title)
            if (h) addToHistory({ ...h, progress: pct })
          }}
        />
      )}

      {showSeasons && selectedSeries && (
        <div className="search-results-overlay" onClick={() => setShowSeasons(false)}>
          <div className="search-results-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-results-header">
              <h2>📺 {selectedSeries.name} - Seasons</h2>
              <button className="close-button" onClick={() => setShowSeasons(false)}>✕</button>
            </div>
            
            <div className="search-results-content">
              <div className="search-results-summary">
                Found {seasons.length} season{seasons.length !== 1 ? 's' : ''}
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
                          alt={season.name || `Season ${index + 1}`} 
                          className="search-result-poster" 
                        />
                      ) : (
                        <div className="search-result-icon">📺</div>
                      )}
                      <div className="search-result-info">
                        <div className="search-result-name">
                          {season.series || season.name || `Season ${index + 1}`}
                        </div>
                        {season.o_name && (
                          <div className="search-result-meta">
                            {loadingItem === season.id ? 'Loading episodes...' : season.o_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEpisodes && selectedSeries && selectedSeason && (
        <div className="search-results-overlay" onClick={() => setShowEpisodes(false)}>
          <div className="search-results-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-results-header">
              <h2>🎬 {selectedSeries.name} - {selectedSeason.series || selectedSeason.name || 'Episodes'}</h2>
              <button className="close-button" onClick={() => setShowEpisodes(false)}>✕</button>
            </div>
            
            <div className="search-results-content">
              <div className="search-results-summary">
                Found {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
              </div>

              <div className="search-section">
                <div className="search-results-grid">
                  {episodes.map((episode: any, index: number) => (
                    <div 
                      key={episode.id || index} 
                      className={`search-result-item ${loadingItem === episode.id ? 'loading' : ''}`}
                      onClick={() => handleEpisodeClick(episode)}
                    >
                      {loadingItem === episode.id ? (
                        <div className="loading-spinner">⏳</div>
                      ) : episode.screenshot_uri || episode.cover_big ? (
                        <img 
                          src={episode.screenshot_uri || episode.cover_big} 
                          alt={episode.name || `Episode ${index + 1}`} 
                          className="search-result-poster" 
                        />
                      ) : (
                        <div className="search-result-icon">🎬</div>
                      )}
                      <div className="search-result-info">
                        <div className="search-result-name">
                          {episode.name || `Episode ${index + 1}`}
                        </div>
                        {episode.o_name && (
                          <div className="search-result-meta">
                            {loadingItem === episode.id ? 'Loading...' : episode.o_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

