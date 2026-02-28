import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
const PORT = process.env.PORT || config.server.port;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false
}));

// Stalker Portal API Authentication - Cache tokens
let portalToken = null;
let portalUserProfile = null;
let authCacheTime = null;

// Step 1: Handshake - Get initial token
async function portalHandshake() {
  try {
    // Return cached token if available (cache for 30 minutes)
    if (portalToken && authCacheTime) {
      const cacheAge = Date.now() - authCacheTime;
      if (cacheAge < 30 * 60 * 1000) {
        console.log(`ℹ️  Using cached authentication token (age: ${Math.floor(cacheAge / 1000)}s)`);
        return true;
      }
    }

    const baseUrl = config.portal.url;

    const params = new URLSearchParams({
      'deviceSn': '',
      'deviceMac': '',
      'deviceType': '',
      'deviceVersion': '',
      'type': 'stb',
      'action': 'handshake',
      'token': config.portal.token || 'AAFA5EFF673835478D4EE0FF788CF1CA',
      'prehash': config.portal.prehash || '9d5ed25bde636a0bdbeb3ce148de680843588c04',
      'JsHttpRequest': '1-xml'
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔐 STEP 1: HANDSHAKE - Getting Initial Token`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`\n📡 Calling: handshake`);
    console.log(`🔗 Full URL:\n${url}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,es;q=0.7,zh-CN;q=0.6,zh;q=0.5,hi;q=0.4,fr;q=0.3,id;q=0.2',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Referer': config.portal.url,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 OPR/127.0.0.0'
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);
    
    const responseText = await response.text();
    console.log(`📝 Raw Response:\n${responseText}\n`);
    
    if (!response.ok) {
      console.error(`❌ Handshake failed - Status: ${response.status}`);
      console.error(`📝 Response:\n${responseText}\n`);
      return false;
    }

    // Try to parse as JSON first (new format) - only token is returned
    let token = null;

    try {
      const jsonData = JSON.parse(responseText);
      if (jsonData.js && jsonData.js.token) {
        token = jsonData.js.token;
        console.log(`✅ Parsed JSON response format\n`);
      }
    } catch (e) {
      // If JSON parsing fails, try XML format (old format)
      const match_token = responseText.match(/<token>([^<]+)<\/token>/);
      
      if (match_token) {
        token = match_token[1];
        console.log(`✅ Parsed XML response format\n`);
      }
    }

    if (token) {
      portalToken = token;
      
      console.log(`✅ HANDSHAKE SUCCESSFUL!\n`);
      console.log(`✅ HANDSHAKE RESPONSE:`);
      console.log(`${'─'.repeat(70)}`);
      console.log(`Token: ${portalToken}`);
      console.log(`${'─'.repeat(70)}\n`);
      
      return true;
    } else {
      console.error(`❌ Failed to extract token from response`);
      console.log(`📝 Response:\n${responseText}\n`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Handshake error: ${error.message}\n`);
    return false;
  }
}

// Step 2: Get User Profile with Bearer token
async function getPortalUserProfile(retryCount = 0) {
  try {
    // Return cached profile if available (cache for 30 minutes)
    if (portalUserProfile && authCacheTime) {
      const cacheAge = Date.now() - authCacheTime;
      if (cacheAge < 30 * 60 * 1000) {
        console.log(`ℹ️  Using cached user profile (age: ${Math.floor(cacheAge / 1000)}s)`);
        return portalUserProfile;
      }
    }

    if (!portalToken) {
      console.log(`⚠️  No token available, performing handshake first...`);
      const handshakeSuccess = await portalHandshake();
      if (!handshakeSuccess) {
        return null;
      }
    }

    const baseUrl = config.portal.url;
    const bearer = `Bearer ${portalToken}`;

    // Simple parameters - just type and action
    const params = new URLSearchParams({
      'type': 'stb',
      'action': 'get_profile'
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔐 STEP 2: GET PROFILE - Getting User Profile`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`\n📡 Calling: get_profile`);
    console.log(`🔗 Full URL:\n${url}\n`);
    console.log(`🔑 Authorization: ${bearer}\n`);

    // Build cookies string
    const cookieStr = `mac=${encodeURIComponent(config.portal.mac)}; stb_lang=en; timezone=Europe%2FParis; adid=8d247d49cbb1f5b9ae320403322f9c9a`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': bearer,
        'X-User-Agent': 'Model: MAG254; Link: Ethernet,WiFi',
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 1812 Mobile Safari/533.3',
        'Referer': config.portal.url,
        'Accept': 'application/json,application/javascript,text/javascript,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Host': new URL(config.portal.url).hostname,
        'Cookie': cookieStr,
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);
    
    const responseText = await response.text();
    console.log(`📝 Raw Response:\n${responseText}\n`);

    if (!response.ok) {
      console.error(`❌ Get profile failed - Status: ${response.status}`);
      console.error(`📝 Response:\n${responseText}\n`);
      
      // If it's a 401/403 and this is first attempt, retry with fresh auth
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log(`🔄 Authentication failed, clearing cache and retrying with fresh token...`);
        portalToken = null;
        portalUserProfile = null;
        authCacheTime = null;
        
        return getPortalUserProfile(retryCount + 1);
      }
      
      return null;
    }

    // Try to parse JSON response
    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If JSON parsing fails and this is first attempt, retry with fresh auth
      if (retryCount === 0) {
        console.log(`🔄 Could not parse response, clearing cache and retrying with fresh token...`);
        portalToken = null;
        portalUserProfile = null;
        authCacheTime = null;
        
        return getPortalUserProfile(retryCount + 1);
      }
      
      console.error(`❌ Failed to parse profile response as JSON`);
      return null;
    }

    if (data) {
      // Cache the profile
      portalUserProfile = data;
      authCacheTime = Date.now();
      
      console.log(`✅ GET PROFILE SUCCESSFUL!\n`);
      console.log(`✅ USER PROFILE RESPONSE:`);
      console.log(`${'─'.repeat(70)}`);
      console.log(JSON.stringify(data, null, 2));
      console.log(`${'─'.repeat(70)}\n`);
      
      return data;
    }
  } catch (error) {
    console.error(`❌ Get profile error: ${error.message}\n`);
    
    // On network error and first attempt, try fresh auth
    if (retryCount === 0) {
      console.log(`🔄 Network error, clearing cache and retrying with fresh token...`);
      portalToken = null;
      portalUserProfile = null;
      authCacheTime = null;
      
      return getPortalUserProfile(retryCount + 1);
    }
    
    return null;
  }
}

// Helper function to call IPTV portal API
async function callPortalAPI(endpoint, params = {}) {
  try {
    const baseUrl = config.portal.url;
    const queryParams = new URLSearchParams({
      mac: config.portal.mac,
      sn: config.portal.serialNumber,
      device_id: config.portal.deviceId,
      signature: config.portal.signature,
      ...params
    });

    const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📡 Calling portal API: ${endpoint}`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`🔗 Full URL: ${url}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'IPTV Player Client',
        'Accept': 'application/json',
        'X-Device-ID': config.portal.deviceId,
        'X-MAC': config.portal.mac
      },
      timeout: 10000
    });

    // Log response status
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}\n`);

    // Get response text first
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Portal API error - Status: ${response.status}`);
      console.error(`📝 Response Body:\n${responseText}\n`);
      return null;
    }

    // Parse JSON from text
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`✅ ${endpoint.toUpperCase()} - RESPONSE RECEIVED\n`);
      console.log(`✅ RESPONSE DATA:`);
      console.log(`${'─'.repeat(70)}`);
      console.log(JSON.stringify(data, null, 2));
      console.log(`${'─'.repeat(70)}\n`);
      return data;
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON: ${parseError.message}`);
      console.log(`📝 Raw response:\n${responseText}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error calling portal API: ${error.message}`);
    console.error(`❌ Stack trace: ${error.stack}`);
    return null;
  }
}

// Helper function to call IPTV portal API with proper headers and auth
async function callPortalAPIWithAuth(action, params = {}, retryCount = 0) {
  try {
    if (!portalToken) {
      console.log(`⚠️  No token available, performing handshake first...`);
      const handshakeSuccess = await portalHandshake();
      if (!handshakeSuccess) {
        return null;
      }
    }

    const baseUrl = config.portal.url;
    const bearer = `Bearer ${portalToken}`;

    const queryParams = new URLSearchParams({
      'type': params.type || 'itv',
      'action': action,
      'JsHttpRequest': '1-xml',
      ...params
    });

    const url = `${baseUrl}?${queryParams.toString()}`;
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📡 Calling portal API: ${action}`);
    console.log(`🔗 Full URL:\n${url}\n`);

    // Build cookies string
    const cookieStr = `mac=${encodeURIComponent(config.portal.mac)}; stb_lang=en; timezone=Europe%2FParis; adid=8d247d49cbb1f5b9ae320403322f9c9a`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': bearer,
        'X-User-Agent': 'Model: MAG254; Link: Ethernet,WiFi',
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 1812 Mobile Safari/533.3',
        'Referer': config.portal.url,
        'Accept': 'application/json,application/javascript,text/javascript,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Host': new URL(config.portal.url).hostname,
        'Cookie': cookieStr,
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 10000
    });

    // Log response status
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}\n`);

    // Get response text first
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Portal API call failed - Status: ${response.status}`);
      console.error(`📝 Response:\n${responseText}\n`);
      
      // If it's a 401/403, try fresh authentication
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log(`🔄 Authentication failed, clearing cache and retrying with fresh token...`);
        portalToken = null;
        portalUserProfile = null;
        authCacheTime = null;
        
        // Retry once with fresh auth
        return callPortalAPIWithAuth(action, params, retryCount + 1);
      }
      
      return null;
    }

    console.log(`📝 Raw Response:\n${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}\n`);

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log(`✅ Portal response parsed as JSON`);
      return data;
    } catch (e) {
      // If JSON parsing fails and it looks like an error response
      console.log(`⚠️  Could not parse as JSON, checking if auth failed...`);
      
      // If it looks like auth failure, retry with fresh token
      if ((responseText.includes('error') || responseText.includes('unauthorized') || responseText.includes('<?xml')) && retryCount === 0) {
        console.log(`🔄 Possible auth issue detected, clearing cache and retrying with fresh token...`);
        portalToken = null;
        portalUserProfile = null;
        authCacheTime = null;
        
        // Retry once with fresh auth
        return callPortalAPIWithAuth(action, params, retryCount + 1);
      }
      
      // If JSON parsing fails, return as is (might be XML or other format)
      console.log(`ℹ️  Could not parse as JSON, returning raw response`);
      return { text: responseText };
    }
  } catch (error) {
    console.error(`❌ Portal API error: ${error.message}\n`);
    
    // On network error, also try fresh auth if this is first attempt
    if (retryCount === 0) {
      console.log(`🔄 Network error, clearing cache and retrying with fresh token...`);
      portalToken = null;
      portalUserProfile = null;
      authCacheTime = null;
      
      // Retry once with fresh auth
      return callPortalAPIWithAuth(action, params, retryCount + 1);
    }
    
    return null;
  }
}

// Middleware
// app.use(cors()); // CORS disabled
app.use(express.json());

// Device Config Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    status: 'ok',
    config: {
      portal: config.portal,
      maxConnections: config.portal.maxConnections,
      expireDate: config.portal.expireDate,
      createdDate: config.portal.createdDate
    }
  });
});

// User Profile Endpoint - Gets authentication token and user profile
app.get('/api/profile', async (req, res) => {
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 Received request for: /api/profile');
  console.log('═'.repeat(70));
  
  const profileData = await getPortalUserProfile();
  
  if (profileData) {
    return res.json({
      status: 'ok',
      source: 'portal',
      profile: profileData
    });
  }
  
  // If auth fails
  res.status(401).json({
    status: 'error',
    message: 'Authentication failed',
    source: 'portal'
  });
});

// Genres/Categories endpoint
app.get('/api/genres', async (req, res) => {
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 Received request for: /api/genres');
  console.log('═'.repeat(70));
  
  try {
    // First authenticate and get profile
    const profileData = await getPortalUserProfile();
    
    if (!profileData) {
      console.log('⚠️  Authentication failed');
      throw new Error('Auth failed');
    }
    
    // Fetch genres from portal
    const genresData = await callPortalAPIWithAuth('get_genres', { type: 'itv' });
    
    if (genresData && genresData.js) {
      console.log(`✅ Got ${genresData.js.length} genres from portal`);
      return res.json({
        status: 'ok',
        source: 'portal',
        channels: genresData.js
      });
    }
  } catch (error) {
    console.error(`❌ Failed to fetch genres: ${error.message}`);
  }

  // Fallback to empty array (no hardcoded data)
  console.log('⚠️  No channel categories available');
  res.json({
    status: 'ok',
    source: 'mock',
    channels: []
  });
});

// Serve static files from the dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Channels endpoint - Get channel categories
app.get('/channels', async (req, res) => {
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 Received request for: /channels');
  console.log('═'.repeat(70));
  
  try {
    // First authenticate and get profile
    const profileData = await getPortalUserProfile();
    
    if (!profileData) {
      console.log('⚠️  Authentication failed');
      throw new Error('Auth failed');
    }
    
    // Fetch channel categories using the portal API
    console.log('📡 Calling get_genres with type: itv');
    const portalData = await callPortalAPIWithAuth('get_genres', { type: 'itv' });
    
    console.log('📊 get_genres response:', portalData ? 'received' : 'null');
    if (portalData) {
      console.log('📊 Response keys:', Object.keys(portalData));
      console.log('📊 portalData.js type:', Array.isArray(portalData?.js) ? 'Array' : typeof portalData?.js);
      console.log('📊 portalData.js length:', portalData?.js?.length);
      if (portalData.js && portalData.js[0]) {
        console.log('📝 First category sample:', JSON.stringify(portalData.js[0]));
      }
      console.log('Full portalData dump:', JSON.stringify(portalData).substring(0, 500));
    } else {
      console.log('⚠️  portalData is NULL - This is the problem!');
    }
    
    if (portalData && portalData.js && Array.isArray(portalData.js) && portalData.js.length > 0) {
      console.log(`\n✅ Portal data received:`, portalData.js.length, 'channel categories');
      
      // Handle different response structures
      const channelCategories = portalData.js || [];
      console.log(`✅ Extracted ${channelCategories.length} channel categories from portal response`);
      
      if (channelCategories.length > 0) {
        // Transform categories into channel items - skip "All" category (id: *)
        const channelItems = channelCategories
          .filter(category => category.id !== '*')
          .map(category => ({
            id: category.id,
            title: category.title,
            alias: category.alias,
            poster: category.poster || 'https://via.placeholder.com/200x300?text=' + encodeURIComponent(category.title)
          }));
        
        console.log(`\n✅ Sending ${channelItems.length} channel categories to frontend`);
        console.log(`📝 Sample item being sent:`, JSON.stringify(channelItems[0]));
        console.log(`📝 All items:`, JSON.stringify(channelItems.slice(0, 3)));
        
        const responseToSend = {
          status: 'ok',
          source: 'portal',
          channels: channelItems
        };
        
        console.log('\n🚀 FINAL RESPONSE PAYLOAD:');
        console.log(JSON.stringify(responseToSend, null, 2));
        console.log('✅ Sending response to frontend...\n');
        
        return res.json(responseToSend);
      }
    } else {
      console.log('\n⚠️  CONDITION FAILED - returning empty channels array');
      if (!portalData) console.log('   └─ portalData is NULL/undefined');
      else if (!portalData.js) console.log('   └─ portalData.js is missing');
      else if (!Array.isArray(portalData.js)) console.log('   └─ portalData.js is not an array, it is:', typeof portalData.js);
      else if (portalData.js.length === 0) console.log('   └─ portalData.js is an empty array');
    }
  } catch (error) {
    console.error(`❌ Failed to fetch from portal: ${error.message}`);
    console.error(`❌ Error stack:`, error.stack);
  }

  // No fallback - return empty array if portal doesn't return data
  console.log('❌ No channel categories available from portal');
  res.json({
    status: 'ok',
    source: 'portal',
    channels: []
  });
});

app.get('/vod', async (req, res) => {
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 Received request for: /vod');
  console.log('═'.repeat(70));
  
  try {
    // Perform authentication once (will use cache on subsequent calls)
    const profileData = await getPortalUserProfile();
    
    if (!profileData) {
      console.log('⚠️  Authentication failed, using mock data');
      throw new Error('Auth failed');
    }
    
    // Fetch VOD categories using the new endpoint format
    const portalData = await callPortalAPIWithAuth('get_categories', { type: 'vod' });
    
    if (portalData && portalData.js) {
      console.log(`\n✅ Portal data received:`, portalData.js.length, 'VOD categories');
      
      // Handle different response structures
      const vodCategories = portalData.js || [];
      console.log(`🎬 Extracted ${vodCategories.length} VOD categories from portal response`);
      
      if (vodCategories.length > 0) {
        // Transform categories into VOD items - skip "All" category (id: *)
        const vodItems = vodCategories
          .filter(category => category.id !== '*')
          .map(category => ({
            id: category.id,
            title: category.title,
            alias: category.alias,
            censored: category.censored,
            poster: category.poster || 'https://via.placeholder.com/200x300?text=' + encodeURIComponent(category.title)
          }));
        
        console.log(`\n✅ Sending ${vodItems.length} VOD items to frontend`);
        return res.json({
          status: 'ok',
          source: 'portal',
          vod: vodItems
        });
      }
    }
  } catch (error) {
    console.error(`❌ Failed to fetch VOD content: ${error.message}`);
  }

  // Fallback to actual response data you provided
  console.log('⚠️  Using fallback VOD content from actual portal response');
  const vodData = [
    { "id": "5", "title": "HINDI TV SHOWS", "alias": "HINDI_TV_SHOWS", "censored": 0 },
    { "id": "6", "title": "HINDI WEB SERIES", "alias": "HINDI_WEB_SERIES", "censored": 0 },
    { "id": "63", "title": "HINDI MOVIES | CAM", "alias": "HINDI_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "1", "title": "HINDI MOVIES | LATEST", "alias": "HINDI_MOVIES__LATEST", "censored": 0 },
    { "id": "75", "title": "HINDI MOVIES | 4K", "alias": "HINDI_MOVIES__4K", "censored": 0 },
    { "id": "2", "title": "HINDI MOVIES | COLLECTION", "alias": "HINDI_MOVIES__COLLECTION", "censored": 0 },
    { "id": "44", "title": "HINDI MOVIES | ENG SUBTITLE", "alias": "HINDI_MOVIES__ENG_SUBS", "censored": 0 },
    { "id": "3", "title": "HINDI DUB | SOUTH MOVIES", "alias": "HINDI_MOVIES__SOUTH_DUB", "censored": 0 },
    { "id": "82", "title": "HINDI DUB | SOUTH MOVIES 4K", "alias": "HINDI_DUB__SOUTH_MOVIES_4K", "censored": 0 },
    { "id": "4", "title": "HINDI DUB | ENGLISH MOVIES", "alias": "HINDI_MOVIES__ENG_DUB", "censored": 0 },
    { "id": "7", "title": "HINDI DUB | ENGLISH SERIES", "alias": "HINDI_WEB_SERIES__ENG_DUB", "censored": 0 },
    { "id": "58", "title": "HINDI DUB | K-DRAMAS", "alias": "HINDI_DUB_K-DRAMAS", "censored": 0 },
    { "id": "61", "title": "HINDI DUB | ANIME", "alias": "HINDI_DUB__ANIME", "censored": 0 },
    { "id": "59", "title": "HINDI RELIGIOUS", "alias": "HINDI_RELIGIOUS", "censored": 0 },
    { "id": "62", "title": "HINDI WEB SERIES (18+)", "alias": "HINDI_WEB_SERIES_18", "censored": 0 },
    { "id": "64", "title": "PUNJABI MOVIES | CAM", "alias": "PUNJABI_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "8", "title": "PUNJABI MOVIES | LATEST", "alias": "PUNJAB_MOVIES", "censored": 0 },
    { "id": "76", "title": "PUNJABI MOVIES | 4K", "alias": "PUNJABI_MOVIES__4K", "censored": 0 },
    { "id": "49", "title": "PUNJABI MOVIES | COLLECTION", "alias": "PUNJABI_MOVIES__COLLECTION", "censored": 0 },
    { "id": "9", "title": "PUNJABI TV SHOW", "alias": "PUNJABI_TV_SHOW", "censored": 0 },
    { "id": "10", "title": "PUNJABI WEB SERIES", "alias": "PUNJABI_WEB_SERIES", "censored": 0 },
    { "id": "11", "title": "PUNJABI RELIGIOUS", "alias": "PUNJABI_RELIGIOUS", "censored": 0 },
    { "id": "65", "title": "ENGLISH MOVIES | CAM", "alias": "ENGLISH_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "12", "title": "ENGLISH MOVIES | LATEST", "alias": "ENGLISH_MOVIES__LATEST", "censored": 0 },
    { "id": "77", "title": "ENGLISH MOVIES | 4K", "alias": "ENGLISH_MOVIES__4K", "censored": 0 },
    { "id": "13", "title": "ENGLISH MOVIES | COLLECTION", "alias": "ENGLISH_MOVIES__COLLECTION", "censored": 0 },
    { "id": "14", "title": "ENGLISH DOCU | MOVIES", "alias": "ENGLISH_DOCUMENTARIES", "censored": 0 },
    { "id": "84", "title": "ENGLISH DOCU | SERIES", "alias": "ENGLISH_DOCUMENTARIES__SERIES", "censored": 0 },
    { "id": "15", "title": "ENGLISH TV SHOW", "alias": "ENGLISH_TV_SHOW", "censored": 0 },
    { "id": "45", "title": "ENGLISH WEB SERIES", "alias": "ENGLISH_WEB_SERIES", "censored": 0 },
    { "id": "60", "title": "K-DRAMAS COLLECTION", "alias": "ENGLISH_DUB__K-DRAMAS", "censored": 0 },
    { "id": "46", "title": "ANIME COLLECTION", "alias": "ANIME_MOVIESSERIES", "censored": 0 },
    { "id": "66", "title": "KIDS MOVIES | CAM", "alias": "KIDS_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "16", "title": "KIDS MOVIES", "alias": "KIDS_MOVIES", "censored": 0 },
    { "id": "88", "title": "KIDS MOVIES | 4K", "alias": "KIDS_MOVIES_4K", "censored": 0 },
    { "id": "47", "title": "KIDS TV SHOW", "alias": "KIDS_TV_SHOW", "censored": 0 },
    { "id": "48", "title": "KIDS HINDI COLLECTION", "alias": "KIDS_HINDI_MOVIESSHOW", "censored": 0 },
    { "id": "18", "title": "URDU MOVIES", "alias": "URDU_MOVIES", "censored": 0 },
    { "id": "19", "title": "URDU TV SHOWS | DRAMAS", "alias": "URDU_TV_SHOWS", "censored": 0 },
    { "id": "20", "title": "URDU STAGE SHOWS", "alias": "URDU_STAGE_SHOWS", "censored": 0 },
    { "id": "67", "title": "GUJARATI MOVIES | CAM", "alias": "GUJARATI_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "21", "title": "GUJARATI MOVIES", "alias": "GUJARATI_MOVIES", "censored": 0 },
    { "id": "85", "title": "GUJARATI MOVIES 4K", "alias": "GUJARATI_MOVIES_4K", "censored": 0 },
    { "id": "22", "title": "GUJARATI TV SHOWS", "alias": "GUJARATI_TV_SHOWS", "censored": 0 },
    { "id": "23", "title": "GUJARATI WEB SERIES", "alias": "GUJARATI_WEB_SERIES", "censored": 0 },
    { "id": "68", "title": "BENGALI MOVIES | CAM", "alias": "BENGALI_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "24", "title": "BENGALI MOVIES", "alias": "BENGALI_MOVIES", "censored": 0 },
    { "id": "87", "title": "BENGALI MOVIES 4K", "alias": "BENGALI_MOVIES_4K", "censored": 0 },
    { "id": "25", "title": "BENGALI TV SHOWS", "alias": "BENGALI_TV_SHOWS", "censored": 0 },
    { "id": "26", "title": "BENGALI WEB SERIES", "alias": "BENGALI_WEB_SERIES", "censored": 0 },
    { "id": "69", "title": "TAMIL MOVIES | CAM", "alias": "TAMIL_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "27", "title": "TAMIL MOVIES | LATEST", "alias": "TAMIL_MOVIES", "censored": 0 },
    { "id": "78", "title": "TAMIL MOVIES | 4K", "alias": "TAMIL_MOVIES__4K", "censored": 0 },
    { "id": "50", "title": "TAMIL MOVIES COLLECTION", "alias": "TAMIL_MOVIES_COLLECTION", "censored": 0 },
    { "id": "51", "title": "TAMIL DUB MOVIES", "alias": "TAMIL_DUB_MOVIES", "censored": 0 },
    { "id": "28", "title": "TAMIL TV SHOWS", "alias": "TAMIL_TV_SHOWS", "censored": 0 },
    { "id": "29", "title": "TAMIL WEB SERIES", "alias": "TAMIL_WEB_SERIES", "censored": 0 },
    { "id": "70", "title": "TELUGU MOVIES | CAM", "alias": "TELUGU_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "30", "title": "TELUGU MOVIES | LATEST", "alias": "TELUGU_MOVIES", "censored": 0 },
    { "id": "79", "title": "TELUGU MOVIES | 4K", "alias": "TELUGU_MOVIES__4K", "censored": 0 },
    { "id": "52", "title": "TELUGU MOVIES | COLLECTION", "alias": "TELUGU_MOVIES__COLLECTION", "censored": 0 },
    { "id": "53", "title": "TELUGU DUB MOVIES", "alias": "TELUGU_DUB_MOVIES", "censored": 0 },
    { "id": "31", "title": "TELUGU TV SHOWS", "alias": "TELUGU_TV_SHOWS", "censored": 0 },
    { "id": "32", "title": "TELUGU WEB SERIES", "alias": "TELUGU_WEB_SERIES", "censored": 0 },
    { "id": "71", "title": "MALAYALAM MOVIES | CAM", "alias": "MALAYALAM_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "33", "title": "MALAYALAM MOVIES | LATEST", "alias": "MALAYALAM_MOVIES", "censored": 0 },
    { "id": "80", "title": "MALAYALAM MOVIES | 4K", "alias": "MALAYALAM_MOVIES__4K", "censored": 0 },
    { "id": "54", "title": "MALAYALAM MOVIES | COLLECTION", "alias": "MALAYALAM_MOVIES__COLLECTION", "censored": 0 },
    { "id": "55", "title": "MALAYALAM DUB MOVIES", "alias": "MALAYALAM_DUB_MOVIES", "censored": 0 },
    { "id": "34", "title": "MALAYALAM TV SHOWS", "alias": "MALAYALAM_TV_SHOWS", "censored": 0 },
    { "id": "35", "title": "MALAYALAM WEB SERIES", "alias": "MALAYALAM_WEB_SERIES", "censored": 0 },
    { "id": "72", "title": "KANNADA MOVIES | CAM", "alias": "KANNADA_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "36", "title": "KANNADA MOVIES | LATEST", "alias": "KANNADA_MOVIES", "censored": 0 },
    { "id": "81", "title": "KANNADA MOVIES | 4K", "alias": "KANNADA_MOVIES__4K", "censored": 0 },
    { "id": "56", "title": "KANNADA MOVIES | COLLECTION", "alias": "KANNADA_MOVIES__COLLECTION", "censored": 0 },
    { "id": "57", "title": "KANNADA DUB MOVIES", "alias": "KANNADA_DUB_MOVIES", "censored": 0 },
    { "id": "37", "title": "KANNADA TV SHOWS", "alias": "KANNADA_TV_SHOWS", "censored": 0 },
    { "id": "38", "title": "KANNADA WEB SERIES", "alias": "KANNADA_WEB_SERIES", "censored": 0 },
    { "id": "73", "title": "MARATHI MOVIES | CAM", "alias": "MARATHI_MOVIES__CAM_PREDVD", "censored": 0 },
    { "id": "39", "title": "MARATHI MOVIES", "alias": "MARATHI_MOVIES", "censored": 0 },
    { "id": "86", "title": "MARATHI MOVIES | 4K", "alias": "MARATHI_MOVIES_4K", "censored": 0 },
    { "id": "40", "title": "MARATHI TV SHOWS", "alias": "MARATHI_TV_SHOWS", "censored": 0 },
    { "id": "41", "title": "MARATHI WEB SERIES", "alias": "MARATHI_WEB_SERIES", "censored": 0 },
    { "id": "89", "title": "FRENCH MOVIES", "alias": "FRENCH_MOVIES", "censored": 0 },
    { "id": "90", "title": "FRENCH MOVIES | 4K", "alias": "FRENCH_MOVIES_4K", "censored": 0 },
    { "id": "91", "title": "FRENCH SERIES", "alias": "FRENCH_SERIES", "censored": 0 },
    { "id": "92", "title": "SPANISH MOVIES", "alias": "SPANISH_MOVIES", "censored": 0 },
    { "id": "93", "title": "SPANISH MOVIES | 4K", "alias": "SPANISH_MOVIES__4K", "censored": 0 },
    { "id": "94", "title": "SPANISH SERIES", "alias": "SPANISH_SERIES", "censored": 0 },
    { "id": "17", "title": "SPORTS - PPV EVENTS", "alias": "KIDS_NURSERY_RHYMES", "censored": 0 },
    { "id": "43", "title": "SPORTS - CRICKET", "alias": "TURKISH_SERIES", "censored": 0 },
    { "id": "83", "title": "ADULTS", "alias": "ADULTS", "censored": 1 }
  ];

  res.json({
    status: 'ok',
    source: 'fallback',
    vod: vodData.map(item => ({
      id: item.id,
      title: item.title,
      alias: item.alias,
      censored: item.censored,
      poster: 'https://via.placeholder.com/200x300?text=' + encodeURIComponent(item.title)
    }))
  });
});


// Legacy movie endpoint - for backward compatibility
app.get('/movies', async (req, res) => {
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 Received request for: /movies (legacy endpoint)');
  console.log('ℹ️  Redirecting to /vod');
  console.log('═'.repeat(70));
  
  // Redirect to VOD endpoint for unified content
  const vod = await fetch(`http://localhost:${PORT}/vod`);
  const vodData = await vod.json();
  
  res.json({
    status: 'ok',
    source: 'vod_redirect',
    movies: vodData.vod
  });
});

// Get channels by category ID with pagination
app.get('/channels/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  
  console.log('\n' + '═'.repeat(70));
  console.log(`🎯 Received request for: /channels/${categoryId}`);
  console.log('═'.repeat(70));
  
  try {
    // First authenticate and get profile
    const profileData = await getPortalUserProfile();
    
    if (!profileData) {
      console.log('⚠️  Authentication failed');
      throw new Error('Auth failed');
    }
    
    // Fetch first page to get pagination info
    const firstPageData = await callPortalAPIWithAuth('get_ordered_list', { 
      type: 'itv',
      genre: categoryId,
      p: '1',
      max_page_items: '14',
      force_ch_link_check: '',
      fav: '0',
      sortby: 'number',
      hd: '0',
      from_ch_id: '0'
    });
    
    // Handle the response structure - channels are in js.data
    const channelsArray = firstPageData?.js?.data || firstPageData?.js || [];
    
    if (!channelsArray || !Array.isArray(channelsArray) || channelsArray.length === 0) {
      console.log(`⚠️  Portal did not return channels for category ${categoryId}`);
      console.log(`📝 Response structure:`, JSON.stringify(firstPageData).substring(0, 200));
      return res.json({
        status: 'ok',
        source: 'portal',
        categoryId: categoryId,
        channels: []
      });
    }
    
    // Collect channels from first page
    let allChannels = [...channelsArray];
    console.log(`📄 Page 1: Got ${channelsArray.length} channels`);
    
    // Get pagination info from the js object
    const paginationInfo = firstPageData?.js || {};
    const totalItems = parseInt(paginationInfo.total_items || 0);
    const pageSize = parseInt(paginationInfo.max_page_items || 14);
    const totalPages = Math.ceil(totalItems / pageSize);
    
    console.log(`📊 Pagination Info: ${totalItems} total items, ${pageSize} per page, ${totalPages} total pages`);
    
    // Fetch remaining pages if needed
    if (totalPages > 1) {
      console.log(`📡 Fetching pages 2-${totalPages}...`);
      for (let page = 2; page <= totalPages; page++) {
        const pageData = await callPortalAPIWithAuth('get_ordered_list', { 
          type: 'itv',
          genre: categoryId,
          p: String(page),
          max_page_items: '14',
          force_ch_link_check: '',
          fav: '0',
          sortby: 'number',
          hd: '0',
          from_ch_id: '0'
        });
        
        // Handle the response structure - channels are in js.data
        const pageChannels = pageData?.js?.data || pageData?.js || [];
        if (pageChannels && Array.isArray(pageChannels) && pageChannels.length > 0) {
          allChannels = allChannels.concat(pageChannels);
          console.log(`📄 Page ${page}: Got ${pageChannels.length} channels (total so far: ${allChannels.length})`);
        } else {
          console.log(`⚠️  Page ${page}: No data received`);
        }
      }
    }
    
    console.log(`\n✅ Total channels fetched: ${allChannels.length}`);
    console.log(`✅ Sending ${allChannels.length} channels to frontend`);
    
    return res.json({
      status: 'ok',
      source: 'portal',
      categoryId: categoryId,
      total_items: totalItems,
      max_page_items: pageSize,
      total_pages: totalPages,
      channels: allChannels
    });
    
  } catch (error) {
    console.error(`❌ Failed to fetch channels: ${error.message}`);
  }

  // Return empty if no data
  console.log(`❌ No channels available for category ${categoryId}`);
  res.json({
    status: 'ok',
    source: 'portal',
    categoryId: categoryId,
    channels: []
  });
});

// Create stream link for a channel - Direct stream request
app.get('/stream-link', async (req, res) => {
  const { cmd } = req.query;
  
  console.log('\n' + '═'.repeat(70));
  console.log('🎬 Received request for: /stream-link');
  console.log(`📝 Raw cmd: ${cmd}`);
  console.log('═'.repeat(70));
  
  if (!cmd) {
    console.log('⚠️  No cmd parameter provided');
    return res.json({
      status: 'error',
      message: 'No cmd parameter provided'
    });
  }
  
  try {
    // The cmd might contain a full URL with "auto " prefix
    // Extract the actual stream URL from cmd
    let streamUrl = cmd;
    
    // If cmd starts with "auto ", extract the URL part
    if (cmd.startsWith('auto ')) {
      streamUrl = cmd.substring(5); // Remove "auto " prefix
      console.log(`✅ Extracted URL from auto command: ${streamUrl}`);
    }
    
    // Ensure URL uses http (not https) to avoid mixed-content issues
    if (streamUrl.startsWith('https://')) {
      streamUrl = streamUrl.replace('https://', 'http://');
    }
    
    console.log(`✅ Final stream URL: ${streamUrl}`);
    
    // Return the stream URL directly for browser playback
    console.log(`✅ Returning direct URL for browser: ${streamUrl}`);
    
    return res.json({
      status: 'ok',
      url: streamUrl,
      cmd: cmd
    });
    
  } catch (error) {
    console.error(`❌ Failed to create stream link: ${error.message}`);
    res.json({
      status: 'error',
      message: error.message
    });
  }
});

// Stream proxy - fetch the stream and forward it to avoid CORS issues
app.get('/proxy-stream', async (req, res) => {
  console.log('\n' + '═'.repeat(70));
  console.log('🎬 PROXY-STREAM ROUTE CALLED!');
  console.log('═'.repeat(70));
  console.log('Full URL:', req.originalUrl);
  console.log('Query params:', req.query);
  const { url } = req.query;
  
  if (!url) {
    console.log('⚠️  No url parameter provided');
    return res.status(400).json({
      status: 'error',
      message: 'No url parameter provided'
    });
  }
  
  try {
    // Decode the URL if it's encoded
    const decodedUrl = typeof url === 'string' ? decodeURIComponent(url) : url;
    console.log(`📡 Proxying stream: ${decodedUrl.substring(0, 80)}...`);
    
    // Prepare fetch options with proper headers
    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://localhost:5000/',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
      }
    };
    
    // Add Range header if provided by client
    if (req.headers.range) {
      fetchOptions.headers['Range'] = req.headers.range;
    }
    
    // Fetch the stream from the original URL
    console.log('🔗 Fetching from:', decodedUrl);
    const response = await fetch(decodedUrl, fetchOptions);
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📊 Content-Length: ${response.headers.get('content-length')}`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch stream: ${response.status} ${response.statusText}`);
      return res.status(response.status).send('Stream not available');
    }
    
    // Set response headers BEFORE piping data
    const contentType = response.headers.get('content-type') || 'video/mp2t';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Forward content-length if available
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'));
    }
    
    // Handle Range requests
    if (response.status === 206) {
      res.status(206);
      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range'));
      }
    }
    
    console.log('✅ Streaming data to client');
    
    // Check if this is an M3U8 playlist URL
    if (decodedUrl.includes('.m3u8')) {
      console.log('📝 Detected M3U8 playlist, rewriting URLs...');
      
      // For M3U8, we need to read and rewrite the content
      const contentText = await response.text();
      
      // Get the base URL for relative paths
      const urlObj = new URL(decodedUrl);
      const baseUrl = urlObj.origin + urlObj.pathname.split('/').slice(0, -1).join('/');
      
      const rewrittenContent = contentText
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          
          // Keep comments and empty lines as-is
          if (!trimmed || trimmed.startsWith('#')) {
            return line;
          }
          
          // Handle absolute URLs
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return `/proxy-stream?url=${encodeURIComponent(trimmed)}`;
          }
          
          // Handle relative URLs
          if (trimmed) {
            try {
              const absoluteUrl = new URL(trimmed, baseUrl).href;
              return `/proxy-stream?url=${encodeURIComponent(absoluteUrl)}`;
            } catch (e) {
              console.error('Failed to parse URL:', trimmed, e.message);
              return line;
            }
          }
          
          return line;
        })
        .join('\n');
      
      console.log('✅ M3U8 playlist rewritten, sending to client');
      res.send(rewrittenContent);
    } else {
      // For binary streams (video segments, etc.), pipe the response body directly
      console.log('📺 Piping binary stream to client');
      
      // Set up error handling for the pipe
      response.body.on('error', (err) => {
        console.error('❌ Error reading stream body:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Stream error');
        } else {
          res.end();
        }
      });
      
      res.on('error', (err) => {
        console.error('❌ Error sending to client:', err.message);
        response.body.destroy();
      });
      
      response.body.pipe(res);
    }
    
  } catch (error) {
    console.error(`❌ Proxy error: ${error.message}`);
    console.error(`❌ Stack: ${error.stack}`);
    if (!res.headersSent) {
      res.status(500).send('Proxy error: ' + error.message);
    } else {
      res.end();
    }
  }
});

// Serve the index.html for all other routes (SPA routing) - but NOT for API routes
app.get('*', (req, res) => {
  // Don't serve HTML for API routes or unknown paths that should 404
  // Only serve for actual SPA routing (no extension, no query params that look like API calls)
  const path = req.path.toLowerCase();
  
  // Check if this looks like an API request
  if (path.startsWith('/api/') || path.startsWith('/proxy') || path.includes('.')) {
    console.log(`⚠️  404 Not Found: ${req.path}`);
    return res.status(404).json({
      status: 'error',
      message: `Route not found: ${req.path}`
    });
  }
  
  // Serve index.html for SPA routing
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
});

