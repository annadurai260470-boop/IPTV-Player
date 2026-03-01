import axios from 'axios';
import { Channel, VODItem, Movie, Series } from '../types/index';

// Create axios instance without baseURL - we'll set it dynamically
const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to set URL dynamically at request time
api.interceptors.request.use((config) => {
  // Always use the current page's origin so the app works on any host
  const baseURL = window.location.origin;

  // If the URL is relative, prepend the baseURL
  if (config.url && !config.url.startsWith('http')) {
    config.url = baseURL + config.url;
  }
  
  return config;
});

export const fetchChannelCategories = async (): Promise<Channel[]> => {
  try {
    const response = await api.get('/channels');
    console.log('🔍 Raw API Response:', response.data);
    console.log('🔍 Response type:', typeof response.data);
    console.log('🔍 Response keys:', response.data ? Object.keys(response.data) : 'null');
    console.log('🔍 Channels property:', response.data?.channels);
    console.log('🔍 Is channels array?', Array.isArray(response.data?.channels));
    console.log('🔍 Channels length:', response.data?.channels?.length);
    if (response.data?.channels?.[0]) {
      console.log('🔍 First channel:', response.data.channels[0]);
    }
    return response.data.channels || [];
  } catch (error) {
    console.error('Error fetching channel categories:', error);
    return [];
  }
};

export const fetchChannelsByCategory = async (categoryId: string): Promise<Channel[]> => {
  try {
    const response = await api.get(`/channels/${categoryId}`);
    return response.data.channels || [];
  } catch (error) {
    console.error('Error fetching channels for category:', error);
    return [];
  }
};

export const fetchChannels = async (): Promise<Channel[]> => {
  try {
    const response = await api.get('/channels');
    return response.data.channels || [];
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
};

export const fetchVOD = async (): Promise<VODItem[]> => {
  try {
    console.log('🔍 Calling API: /vod');
    const response = await api.get('/vod');
    console.log('✅ fetchVOD response:', response.data);
    return response.data.vod || [];
  } catch (error) {
    console.error('Error fetching VOD content:', error);
    return [];
  }
};

export const fetchSeries = async (): Promise<VODItem[]> => {
  try {
    console.log('🔍 Calling API: /series');
    const response = await api.get('/series');
    console.log('✅ fetchSeries response:', response.data);
    return response.data.series || [];
  } catch (error) {
    console.error('Error fetching Series content:', error);
    return [];
  }
};

export const fetchVODByCategory = async (categoryId: string): Promise<VODItem[]> => {
  try {
    const response = await api.get(`/vod/${categoryId}`);
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching VOD items for category:', error);
    return [];
  }
};

export const fetchSeriesByCategory = async (categoryId: string): Promise<VODItem[]> => {
  try {
    const response = await api.get(`/series/${categoryId}`);
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching Series items for category:', error);
    return [];
  }
};

export const fetchSeriesSeasons = async (seriesId: string, categoryId?: string): Promise<any[]> => {
  try {
    const params = categoryId ? `?category=${categoryId}` : '';
    const url = `/series/${seriesId}/seasons${params}`;
    console.log(`📡 API Call: GET ${url}`);
    
    const response = await api.get(url);
    console.log('📦 Seasons response:', response.data);
    
    return response.data.seasons || [];
  } catch (error) {
    console.error('Error fetching series seasons:', error);
    return [];
  }
};

export const fetchSeriesEpisodes = async (seriesId: string, seasonId: string, categoryId?: string): Promise<any[]> => {
  try {
    const params = categoryId ? `?category=${categoryId}` : '';
    const url = `/series/${seriesId}/seasons/${seasonId}/episodes${params}`;
    console.log(`📡 API Call: GET ${url}`);
    
    const response = await api.get(url);
    console.log('📦 Episodes response:', response.data);
    
    return response.data.episodes || [];
  } catch (error) {
    console.error('Error fetching series episodes:', error);
    return [];
  }
};

export const fetchEpisodeDetails = async (seriesId: string, seasonId: string, episodeId: string, categoryId?: string): Promise<any | null> => {
  try {
    const params = categoryId ? `?category=${categoryId}` : '';
    const url = `/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}${params}`;
    console.log(`📡 API Call: GET ${url}`);
    
    const response = await api.get(url);
    console.log('📦 Episode details response:', response.data);
    
    return response.data.episode || null;
  } catch (error) {
    console.error('Error fetching episode details:', error);
    return null;
  }
};

export const createStreamLink = async (cmd: string): Promise<string | null> => {
  try {
    console.log('🎬 Creating stream link for cmd:', cmd);
    const response = await api.get('/stream-link', {
      params: { cmd }
    });
    console.log('✅ Stream link response:', response.data);
    
    if (response.data.status === 'ok' && response.data.url) {
      console.log('✅ Stream URL:', response.data.url);
      
      // For live streams, return the direct URL
      // hls.js will be able to load it with proper CORS handling
      console.log('✅ Returning stream URL for client-side loading');
      
      // Resolve relative URLs to absolute for proxy-stream (channels)
      // VOD streams are already absolute URLs
      let streamUrl = response.data.url;
      if (streamUrl.startsWith('/')) {
        streamUrl = window.location.origin + streamUrl;
        console.log('✅ Resolved relative proxy URL to:', streamUrl);
      } else {
        console.log('✅ Using direct stream URL:', streamUrl);
      }
      return streamUrl;
    } else {
      console.error('❌ Failed to create stream link:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error creating stream link:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FAVORITES API
// ═══════════════════════════════════════════════════════════════════════════

export const fetchFavoriteChannels = async (): Promise<Channel[]> => {
  try {
    console.log('⭐ Fetching favorite channels');
    const response = await api.get('/favorites/channels');
    return response.data.favorites || [];
  } catch (error) {
    console.error('Error fetching favorite channels:', error);
    return [];
  }
};

export const fetchFavoriteChannelIds = async (): Promise<string[]> => {
  try {
    const response = await api.get('/favorites/channels/ids');
    return response.data.ids || [];
  } catch (error) {
    console.error('Error fetching favorite channel IDs:', error);
    return [];
  }
};

export const addChannelToFavorites = async (channelId: string): Promise<boolean> => {
  try {
    console.log('⭐ Adding channel to favorites:', channelId);
    const response = await api.post(`/favorites/channels/${channelId}`);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Error adding channel to favorites:', error);
    return false;
  }
};

export const removeChannelFromFavorites = async (channelId: string): Promise<boolean> => {
  try {
    console.log('⭐ Removing channel from favorites:', channelId);
    const response = await api.delete(`/favorites/channels/${channelId}`);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Error removing channel from favorites:', error);
    return false;
  }
};

export const fetchFavoriteVOD = async (): Promise<VODItem[]> => {
  try {
    console.log('⭐ Fetching favorite VOD');
    const response = await api.get('/favorites/vod');
    return response.data.favorites || [];
  } catch (error) {
    console.error('Error fetching favorite VOD:', error);
    return [];
  }
};

export const toggleVODFavorite = async (videoId: string, favorite: boolean): Promise<boolean> => {
  try {
    console.log(`⭐ ${favorite ? 'Adding' : 'Removing'} VOD ${videoId} ${favorite ? 'to' : 'from'} favorites`);
    const response = await api.post(`/favorites/vod/${videoId}`, { favorite });
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Error toggling VOD favorite:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EPG API
// ═══════════════════════════════════════════════════════════════════════════

export interface EPGProgram {
  id: string;
  ch_id: string;
  name: string;
  time: string;
  t_time: string;
  start_timestamp: number;
  stop_timestamp: number;
  start: string;
  stop: string;
  descr?: string;
  category?: string;
  director?: string;
  actor?: string;
  mark_memo?: number;
}

export interface EPGResponse {
  status: string;
  channelId?: string;
  programs: EPGProgram[];
  current: EPGProgram | null;
  next: EPGProgram | null;
}

export const fetchEPG = async (period: number = 6): Promise<Record<string, EPGProgram[]>> => {
  try {
    console.log(`📺 Fetching EPG data for ${period} hours`);
    const response = await api.get('/epg', {
      params: { period }
    });
    return response.data.epg || {};
  } catch (error) {
    console.error('Error fetching EPG:', error);
    return {};
  }
};

export const fetchChannelEPG = async (channelId: string): Promise<EPGResponse> => {
  try {
    console.log(`📺 Fetching EPG for channel ${channelId}`);
    const response = await api.get(`/epg/${channelId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching channel EPG:', error);
    return {
      status: 'error',
      programs: [],
      current: null,
      next: null
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH API
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResults {
  status: string;
  query: string;
  totalResults: number;
  results: {
    channels: Channel[];
    vod: VODItem[];
    series: VODItem[];
  };
}

export const fetchRadioCategories = async (): Promise<Channel[]> => {
  try {
    const response = await api.get('/radio');
    return response.data.channels || [];
  } catch (error) {
    console.error('Error fetching radio categories:', error);
    return [];
  }
};

export const fetchRadioByCategory = async (categoryId: string): Promise<Channel[]> => {
  try {
    const response = await api.get(`/radio/${categoryId}`);
    return response.data.channels || [];
  } catch (error) {
    console.error('Error fetching radio stations for category:', error);
    return [];
  }
};

export const searchContent = async (query: string, type?: 'all' | 'channels' | 'vod' | 'series'): Promise<SearchResults> => {
  try {
    console.log(`🔍 Searching for: "${query}" in ${type || 'all'}`);
    const response = await api.get('/search', {
      params: { q: query, type }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching content:', error);
    return {
      status: 'error',
      query: query,
      totalResults: 0,
      results: {
        channels: [],
        vod: [],
        series: []
      }
    };
  }
};
