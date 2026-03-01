import React, { useMemo, useState } from 'react'
import '../styles/ChannelGrid.css'
import { Channel, VODItem, Episode } from '../types/index'
import { FavoriteItem } from '../hooks/useFavorites'

/* ─── Types ──────────────────────────────────────────────── */
export type SortOrder = 'default' | 'az' | 'za'

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
function sortItems<T extends { title?: string; name?: string }>(
  items: T[],
  order: SortOrder
): T[] {
  if (order === 'default') return items
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
    title={active ? 'Remove from favourites' : 'Add to favourites'}
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
}) => {
  const [localSort, setLocalSort] = useState<SortOrder>(sortOrder)
  const effectiveSort = showSortControls ? localSort : sortOrder

  // All hooks must be called unconditionally at top level
  const sortedChannels = useMemo(() => sortItems(channels, effectiveSort), [channels, effectiveSort])
  const sortedVOD      = useMemo(() => sortItems(vod,      effectiveSort), [vod,      effectiveSort])

  /* ---------- CHANNELS ---------- */
  if (type === 'channels') {
    if (sortedChannels.length === 0) {
      return (
        <div className="empty-state">
          <p>📡</p>
          <p>No channels found</p>
        </div>
      )
    }

    return (
      <div className="channel-grid">
        {showSortControls && <SortBar sort={localSort} onSort={setLocalSort} count={sortedChannels.length} />}
        <div className={`grid-container${!isCategory ? ' poster-grid' : ''}`}>
          {sortedChannels.map((ch, i) => {
            const title  = ch.title || ch.name || 'Channel'
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
        <p>No {categoryType === 'series' ? 'series' : categoryType === 'favorites' ? 'favourites yet' : 'movies'} found</p>
      </div>
    )
  }

  return (
    <div className="channel-grid">
      {showSortControls && <SortBar sort={localSort} onSort={setLocalSort} count={sortedVOD.length} />}
      <div className={`grid-container${!isCategory ? ' poster-grid' : ''}`}>
        {sortedVOD.map((item, i) => {
          const title  = item.name || item.title || 'Untitled'
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
                      <span className="episode-number">Ep {ei + 1}</span>
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
    <span className="sort-count">{count} item{count !== 1 ? 's' : ''}</span>
    <div className="sort-btns">
      <button className={`sort-btn ${sort === 'default' ? 'active' : ''}`} onClick={() => onSort('default')}>Default</button>
      <button className={`sort-btn ${sort === 'az' ? 'active' : ''}`} onClick={() => onSort('az')}>A → Z</button>
      <button className={`sort-btn ${sort === 'za' ? 'active' : ''}`} onClick={() => onSort('za')}>Z → A</button>
    </div>
  </div>
)

export default ChannelGrid


