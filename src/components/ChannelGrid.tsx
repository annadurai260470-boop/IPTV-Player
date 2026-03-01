import React, { useMemo, useState } from 'react'
import '../styles/ChannelGrid.css'
import { Channel, VODItem, Episode } from '../types/index'
import { FavoriteItem } from '../hooks/useFavorites'
import { t, tc } from '../i18n'

/* ─── Types ──────────────────────────────────────────────── */
export type SortOrder = 'default' | 'az' | 'za' | 'recent'

interface ChannelGridProps {
  channels?: Channel[]
  vod?: VODItem[]
  onSelectChannel?: (channel: Channel) => void
  onSelectVOD?: (item: VODItem) => void
  onSelectEpisode?: (episode: Episode, vodTitle: string) => void
  onToggleFavorite?: (item: FavoriteItem) => void
  isFavorite?: (id: string) => boolean
  type: 'channels' | 'vod'
  isCategory?: boolean
  categoryType?: 'channels' | 'movies' | 'series' | 'favorites'
  sortOrder?: SortOrder
  showSortControls?: boolean
  recentIds?: string[]
}

/* ─── Tamil translation map for API-returned names ──────── */
const TAMIL_MAP: Record<string, string> = {
  // Languages / Regions
  'indian': 'இந்தியன்', 'india': 'இந்தியா',
  'tamil': 'தமிழ்', 'telugu': 'தெலுங்கு', 'malayalam': 'மலையாளம்',
  'kannada': 'கன்னடம்', 'bengali': 'வங்காளி', 'punjabi': 'பஞ்சாபி',
  'hindi': 'இந்தி', 'marathi': 'மராத்தி', 'gujarati': 'குஜராத்தி',
  'odia': 'ஒடியா', 'assamese': 'அஸ்ஸாமீஸ்', 'nepali': 'நேபாளி',
  'urdu': 'உர்து', 'pakistani': 'பாகிஸ்தானி', 'afghani': 'ஆப்கானி',
  'iran': 'ஈரான்', 'arabic': 'அரபிக்', 'turkish': 'துருக்கிஷ்',
  'english': 'ஆங்கிலம்', 'french': 'பிரஞ்சு', 'spanish': 'ஸ்பானிஷ்',
  'german': 'ஜெர்மன்', 'italian': 'இத்தாலியன்', 'portuguese': 'போர்த்துகீஸ்',
  'russian': 'ரஷியன்', 'chinese': 'சீனம்', 'japanese': 'ஜப்பானீஸ்',
  'korean': 'கொரியன்', 'thai': 'தாய்', 'vietnamese': 'வியட்நாமீஸ்',
  // Categories
  'sports': 'விளையாட்டு', 'sport': 'விளையாட்டு',
  'supersport': 'சூப்பர்ஸ்போர்ட்', 'bein sports': 'பேய்ன் ஸ்போர்ட்ஸ்',
  'news': 'செய்திகள்', 'live news': 'நேரலை செய்திகள்',
  'movies': 'திரைப்படங்கள்', 'movie': 'திரைப்படம்',
  'films': 'திரைப்படங்கள்', 'film': 'திரைப்படம்', 'cinema': 'சினிமா',
  'series': 'தொடர்கள்', 'tv series': 'தொலைக்காட்சி தொடர்கள்',
  'kids': 'குழந்தைகள்', 'children': 'குழந்தைகள்', 'cartoon': 'கார்ட்டூன்',
  'music': 'இசை', 'entertainment': 'பொழுதுபோக்கு',
  'comedy': 'நகைச்சுவை', 'action': 'சாகசம்', 'drama': 'நாடகம்',
  'documentary': 'ஆவணப்படம்', 'documentary channels': 'ஆவணப்பட சேனல்கள்',
  'religious': 'மத நிகழ்ச்சிகள்', 'islamic channels': 'இஸ்லாமிய சேனல்கள்',
  'islamic': 'இஸ்லாமிய', 'devotional': 'பக்தி',
  'cooking': 'சமையல்', 'food': 'உணவு', 'travel': 'பயணம்',
  'nature': 'இயற்கை', 'science': 'அறிவியல்', 'history': 'வரலாறு',
  'business': 'வணிகம்', 'finance': 'நிதி',
  'lifestyle': 'வாழ்க்கை முறை', 'fashion': 'ஃபேஷன்',
  'horror': 'திகில்', 'thriller': 'த்ரில்லர்', 'romance': 'காதல்',
  'animation': 'அனிமேஷன்', 'family': 'குடும்பம்',
  'general': 'பொது', 'channels': 'சேனல்கள்', 'channel': 'சேனல்',
  'all channels': 'அனைத்து சேனல்கள்', 'premium': 'பிரீமியம்',
  'hd': 'HD', '4k': '4K', 'uhd': 'UHD',
  'local': 'உள்ளூர்', 'regional': 'பிராந்திய', 'national': 'தேசிய',
  'international': 'சர்வதேச',
  'cricket': 'கிரிக்கெட்', 'football': 'கால்பந்து', 'basketball': 'கூடைப்பந்து',
  'tennis': 'டென்னிஸ்', 'racing': 'பந்தயம்',
  // Common suffixes / words
  'tv': 'தொலைக்காட்சி', 'channels hd': 'HD சேனல்கள்',
}

/**
 * Translate an API-returned name to Tamil.
 * Tries full match first, then word-by-word, falls back to original.
 */
function toTamil(name: string): string {
  const lower = name.trim().toLowerCase()
  // Full string match
  if (TAMIL_MAP[lower]) return TAMIL_MAP[lower]
  // Partial / word-level replacement
  let result = lower
  // Sort by length desc so longer phrases match first
  const keys = Object.keys(TAMIL_MAP).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (result.includes(key)) {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), TAMIL_MAP[key])
    }
  }
  // If nothing changed, return original (keep proper capitalisation)
  return result === lower ? name : result
}

/* ─── Colour palette for category cards ─────────────────── */
const CAT_COLOURS = ['clr-blue', 'clr-purple', 'clr-teal', 'clr-green', 'clr-orange', 'clr-red']
const CAT_ICONS   = ['📡', '🎬', '📺', '🌍', '🎭', '⚡', '🏆', '🎵', '🌟', '🎯']

const catColour = (i: number) => CAT_COLOURS[i % CAT_COLOURS.length]
const catIcon   = (title: string, i: number) => {
  const t = title.toLowerCase()
  if (t.includes('sport'))  return '🏆'
  if (t.includes('news'))   return '📰'
  if (t.includes('movie') || t.includes('film') || t.includes('cinema')) return '🎬'
  if (t.includes('kids')  || t.includes('child')) return '🎠'
  if (t.includes('music'))  return '🎵'
  if (t.includes('docu'))   return '🌍'
  if (t.includes('comedy')) return '😄'
  if (t.includes('action')) return '⚡'
  return CAT_ICONS[i % CAT_ICONS.length]
}

/* ─── Image helpers ──────────────────────────────────────── */
const channelImage = (ch: Channel) => ch.logo || ch.icon || ch.poster || ''
const vodImage     = (v: VODItem)  => v.poster || v.screenshot_uri || v.cover_big || v.img || ''

/* ─── Sort helper ────────────────────────────────────────── */
function sortItems<T extends { title?: string; name?: string; id?: string | number }>(
  items: T[],
  order: SortOrder,
  recentIds?: string[]
): T[] {
  if (order === 'default') return items
  if (order === 'recent' && recentIds && recentIds.length > 0) {
    return [...items].sort((a, b) => {
      const ia = recentIds.indexOf(String(a.id ?? ''))
      const ib = recentIds.indexOf(String(b.id ?? ''))
      if (ia === -1 && ib === -1) return 0
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  }
  if (order === 'recent') return items
  return [...items].sort((a, b) => {
    const ta = (a.title || a.name || '').toLowerCase()
    const tb = (b.title || b.name || '').toLowerCase()
    return order === 'az' ? ta.localeCompare(tb) : tb.localeCompare(ta)
  })
}

/* ─── Heart button ───────────────────────────────────────── */
interface HeartBtnProps {
  active: boolean
  onClick: (e: React.MouseEvent) => void
}
const HeartBtn: React.FC<HeartBtnProps> = ({ active, onClick }) => (
  <button
    className={`fav-btn ${active ? 'fav-btn--active' : ''}`}
    onClick={onClick}
    title={active ? t('fav_remove') : t('fav_add')}
  >
    {active ? '❤️' : '🤍'}
  </button>
)

/* ─── Main Component ─────────────────────────────────────── */
export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels  = [],
  vod       = [],
  onSelectChannel,
  onSelectVOD,
  onSelectEpisode,
  onToggleFavorite,
  isFavorite = () => false,
  type,
  isCategory = false,
  categoryType,
  sortOrder  = 'default',
  showSortControls = false,
  recentIds = [],
}) => {
  const [localSort, setLocalSort] = useState<SortOrder>(sortOrder)
  const effectiveSort = showSortControls ? localSort : sortOrder

  // All hooks must be called unconditionally at top level
  const sortedChannels = useMemo(() => sortItems(channels, effectiveSort, recentIds), [channels, effectiveSort, recentIds])
  const sortedVOD      = useMemo(() => sortItems(vod,      effectiveSort), [vod,      effectiveSort])

  /* ---------- CHANNELS ---------- */
  if (type === 'channels') {
    if (sortedChannels.length === 0) {
      return (
        <div className="empty-state">
          <p>📡</p>
          <p>{t('no_channels')}</p>
        </div>
      )
    }

    return (
      <div className="channel-grid">
        {showSortControls && <SortBar sort={localSort} onSort={setLocalSort} count={sortedChannels.length} />}
        <div className={`grid-container${!isCategory ? ' poster-grid' : ''}`}>
          {sortedChannels.map((ch, i) => {
            const title  = toTamil(ch.title || ch.name || t('unnamed_channel'))
            const imgSrc = channelImage(ch)
            const faved  = isFavorite(String(ch.id))

            /* ── Category card ── */
            if (isCategory) {
              return (
                <div key={ch.id ?? i} className="grid-item category-item"
                  onClick={() => onSelectChannel?.(ch)}>
                  <div className="item-image">
                    <div className={`category-face ${catColour(i)}`}>
                      <span className="cat-icon">{catIcon(title, i)}</span>
                      <span className="cat-name">{title}</span>
                    </div>
                  </div>
                </div>
              )
            }

            /* ── Channel card ── */
            return (
              <div key={ch.id ?? i} className="grid-item channel-item"
                onClick={() => onSelectChannel?.(ch)}>
                <div className="item-image">
                  {imgSrc ? (
                    <img src={imgSrc} alt={title} loading="lazy"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className={`category-face ${catColour(i)}`}>
                      <span className="cat-icon">📡</span>
                      <span className="cat-name">{title}</span>
                    </div>
                  )}
                  {imgSrc && (
                    <div className="item-overlay">
                      <div className="item-overlay-title">{title}</div>
                    </div>
                  )}
                  <div className="play-overlay">▶</div>
                  {onToggleFavorite && (
                    <HeartBtn active={faved} onClick={e => {
                      e.stopPropagation()
                      onToggleFavorite({ id: String(ch.id), title, image: imgSrc, type: 'channel', cmd: ch.cmd, addedAt: 0 })
                    }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ---------- VOD / SERIES ---------- */
  if (sortedVOD.length === 0) {
    return (
      <div className="empty-state">
        <p>{categoryType === 'series' ? '📺' : categoryType === 'favorites' ? '❤️' : '🎬'}</p>
        <p>{categoryType === 'series' ? t('no_series') : categoryType === 'favorites' ? t('no_favorites') : t('no_movies')}</p>
      </div>
    )
  }

  return (
    <div className="channel-grid">
      {showSortControls && <SortBar sort={localSort} onSort={setLocalSort} count={sortedVOD.length} />}
      <div className={`grid-container${!isCategory ? ' poster-grid' : ''}`}>
        {sortedVOD.map((item, i) => {
          const title  = toTamil(item.name || item.title || t('unnamed_title'))
          const imgSrc = vodImage(item)
          const faved  = isFavorite(String(item.id))

          /* ── VOD/Series Category card ── */
          if (isCategory) {
            return (
              <div key={item.id ?? i} className="grid-item category-item"
                onClick={() => onSelectVOD?.(item)}>
                <div className="item-image">
                  {imgSrc ? (
                    <>
                      <img src={imgSrc} alt={title} loading="lazy"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      <div className="item-overlay">
                        <div className="item-overlay-title">{title}</div>
                      </div>
                    </>
                  ) : (
                    <div className={`category-face ${catColour(i)}`}>
                      <span className="cat-icon">{catIcon(title, i)}</span>
                      <span className="cat-name">{title}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          /* ── Actual VOD / Series item ── */
          return (
            <div key={item.id ?? i} className="grid-item vod-container movie-item"
              onClick={() => onSelectVOD?.(item)}>
              <div className="item-image">
                {imgSrc ? (
                  <img src={imgSrc} alt={title} loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className={`category-face ${catColour(i)}`}>
                    <span className="cat-icon">{categoryType === 'series' ? '📺' : categoryType === 'favorites' ? '❤️' : '🎬'}</span>
                    <span className="cat-name">{title}</span>
                  </div>
                )}
                <div className="item-overlay">
                  <div className="item-overlay-title">{title}</div>
                </div>
                <div className="play-overlay">▶</div>
                {onToggleFavorite && (
                  <HeartBtn active={faved} onClick={e => {
                    e.stopPropagation()
                    const vodType = categoryType === 'series' ? 'series' : 'movie'
                    onToggleFavorite({ id: String(item.id), title, image: imgSrc, type: vodType, cmd: item.cmd, addedAt: 0 })
                  }} />
                )}
              </div>
              {item.episodes && item.episodes.length > 0 && (
                <div className="episodes-list">
                  {item.episodes.map((ep, ei) => (
                    <div key={ep.id ?? ei} className="episode-item"
                      onClick={e => { e.stopPropagation(); onSelectEpisode?.(ep, title) }}>
                      <span className="episode-number">{t('episode_short')} {ei + 1}</span>
                      <span className="episode-title">{ep.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Sort bar component ─────────────────────────────────── */
const SortBar: React.FC<{ sort: SortOrder; onSort: (s: SortOrder) => void; count: number }> = ({ sort, onSort, count }) => (
  <div className="sort-bar">
    <span className="sort-count">{tc(count, 'items_label')}</span>
    <div className="sort-btns">
      <button className={`sort-btn ${sort === 'default' ? 'active' : ''}`} onClick={() => onSort('default')}>{t('sort_default')}</button>
      <button className={`sort-btn ${sort === 'az' ? 'active' : ''}`} onClick={() => onSort('az')}>A → Z</button>
      <button className={`sort-btn ${sort === 'za' ? 'active' : ''}`} onClick={() => onSort('za')}>Z → A</button>
      <button className={`sort-btn ${sort === 'recent' ? 'active' : ''}`} onClick={() => onSort('recent')}>{t('sort_recent')}</button>
    </div>
  </div>
)

export default ChannelGrid


