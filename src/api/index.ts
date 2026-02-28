import axios from 'axios';
import { Channel, VODItem, Movie, Series } from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
    const response = await api.get('/vod');
    return response.data.vod || [];
  } catch (error) {
    console.error('Error fetching VOD content:', error);
    return [];
  }
};

export const fetchMovies = async (): Promise<Movie[]> => {
  try {
    const response = await api.get('/movies');
    return response.data.movies || [];
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
};

export const fetchSeries = async (): Promise<Series[]> => {
  try {
    const response = await api.get('/series');
    return response.data.series || [];
  } catch (error) {
    console.error('Error fetching series:', error);
    return [];
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
      console.log('✅ Returning direct stream URL for client-side loading');
      return response.data.url;
    } else {
      console.error('❌ Failed to create stream link:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error creating stream link:', error);
    return null;
  }
};


