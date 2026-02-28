import './App.css'
import React, { useState, useEffect } from 'react'
import { ChannelGrid } from './components/ChannelGrid'
import { VideoPlayer } from './components/VideoPlayer'
import { fetchChannelCategories, fetchChannelsByCategory, fetchVOD, createStreamLink } from './api/index'
import { Channel, VODItem, Episode } from './types/index'

function App() {
  const [activeTab, setActiveTab] = useState<'channels' | 'vod'>('vod')
  const [channelCategories, setChannelCategories] = useState<Channel[]>([])
  const [selectedChannelCategory, setSelectedChannelCategory] = useState<Channel | null>(null)
  const [channelsInCategory, setChannelsInCategory] = useState<Channel[]>([])
  const [vodContent, setVodContent] = useState<VODItem[]>([])
  const [loading, setLoading] = useState(true)
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ title: string; url: string } | null>(null)

  // Load VOD on initial mount
  useEffect(() => {
    loadVOD()
  }, [])

  // Load channel categories when tab is switched to channels
  useEffect(() => {
    if (activeTab === 'channels' && channelCategories.length === 0 && !selectedChannelCategory) {
      loadChannelCategories()
    }
  }, [activeTab])

  const loadVOD = async () => {
    setLoading(true)
    try {
      const vodData = await fetchVOD()
      console.log('VOD data loaded:', vodData)
      setVodContent(vodData)
    } catch (error) {
      console.error('Error loading VOD content:', error)
    } finally {
      setLoading(false)
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
    console.log(`🎬 Playing channel: ${channelTitle}`)
    
    if (!channel.cmd) {
      console.error('❌ Channel has no cmd field')
      return
    }
    
    // Create stream link via backend
    const streamUrl = await createStreamLink(channel.cmd)
    
    if (streamUrl) {
      console.log(`✅ Stream URL: ${streamUrl}`)
      setSelectedItem({ title: channelTitle, url: streamUrl })
    } else {
      console.error('❌ Failed to create stream link')
    }
  }

  const handleSelectVOD = (item: VODItem) => {
    if (item.url) {
      setSelectedItem({ title: item.title, url: item.url })
    }
  }

  const handleSelectEpisode = (episode: Episode, vodTitle: string) => {
    setSelectedItem({
      title: `${vodTitle} - ${episode.title}`,
      url: episode.url
    })
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
              onClick={() => {
                setActiveTab('channels')
                handleBackToChannelCategories()
              }}
            >
              📡 Channels
            </button>
            <button
              className={`tab-button ${activeTab === 'vod' ? 'active' : ''}`}
              onClick={() => setActiveTab('vod')}
            >
              🎬 VOD (Movies & Series)
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {(loading && activeTab === 'vod') || (channelsLoading && activeTab === 'channels') ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading {activeTab === 'vod' ? 'VOD content' : 'channels'}...</p>
          </div>
        ) : (
          <>
            {activeTab === 'channels' && (
              <>
                {(() => {
                  console.log('📡 DEBUG: channelCategories state:', {
                    length: channelCategories.length,
                    data: JSON.stringify(channelCategories.slice(0, 2))
                  });
                  return null;
                })()}
                {selectedChannelCategory && (
                  <div style={{ padding: '10px', marginBottom: '10px' }}>
                    <button 
                      onClick={handleBackToChannelCategories}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ← Back to Categories
                    </button>
                    <h2 style={{ marginTop: '10px' }}>{selectedChannelCategory.title || selectedChannelCategory.name}</h2>
                  </div>
                )}
                <ChannelGrid
                  channels={selectedChannelCategory ? channelsInCategory : channelCategories}
                  onSelectChannel={selectedChannelCategory ? handleSelectChannel : handleSelectChannelCategory}
                  type="channels"
                />
                {(() => {
                  const dataToPass = selectedChannelCategory ? channelsInCategory : channelCategories;
                  console.log('📡 PASSING TO CHANNELGRID:', {
                    isSelected: !!selectedChannelCategory,
                    arrayLength: dataToPass.length,
                    firstItem: dataToPass[0],
                    allData: JSON.stringify(dataToPass.slice(0, 2))
                  });
                  return null;
                })()}
              </>
            )}
            {activeTab === 'vod' && (
              <ChannelGrid
                vod={vodContent}
                onSelectVOD={handleSelectVOD}
                onSelectEpisode={handleSelectEpisode}
                type="vod"
              />
            )}
          </>
        )}
      </main>

      {selectedItem && (
        <VideoPlayer
          title={selectedItem.title}
          url={selectedItem.url}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

export default App

