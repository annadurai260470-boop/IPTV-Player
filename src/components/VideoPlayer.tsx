import React, { useState, useRef, useEffect, useCallback } from 'react'
import '../styles/VideoPlayer.css'
import HLS from 'hls.js'
import { t } from '../i18n'

interface VideoPlayerProps {
  title:    string
  url:      string
  onClose:  () => void
  onProgress?: (progress: number) => void
}

function fmt(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = Math.floor(s % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    : `${m}:${String(ss).padStart(2,'0')}`
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ title, url, onClose, onProgress }) => {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef       = useRef<HLS | null>(null)
  const mpegtsRef    = useRef<any>(null)
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [playing,      setPlaying]      = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [volume,       setVolume]       = useState(1)
  const [muted,        setMuted]        = useState(false)
  const [fullscreen,   setFullscreen]   = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLive,       setIsLive]       = useState(false)

  /* ─── Controls auto-hide ─────────────────────────────────── */
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }, [playing])

  /* ─── Keyboard shortcuts ─────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'Escape':
          onClose()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(10)
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(-10)
          break
        case 'ArrowUp':
          e.preventDefault()
          adjustVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          adjustVolume(-0.1)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
      resetHideTimer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, volume, muted])   // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Fullscreen change listener ─────────────────────────── */
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  /* ─── Stream init ────────────────────────────────────────── */
  useEffect(() => {
    if (!videoRef.current || !url) return
    setLoading(true)
    setError(null)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    const v = videoRef.current

    const onCanPlay = () => {
      setLoading(false)
      setIsLive(!isFinite(v.duration) || v.duration === Infinity)
      v.play().catch(() => {})
    }
    const onPlay     = () => setPlaying(true)
    const onPause    = () => setPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime)
      if (v.duration && isFinite(v.duration)) {
        const pct = (v.currentTime / v.duration) * 100
        onProgress?.(pct)
      }
    }
    const onDuration = () => setDuration(isFinite(v.duration) ? v.duration : 0)
    const onError    = () => {
      const codes: Record<number,string> = {
        1: 'Loading aborted', 2: 'Network error',
        3: 'Decode error (format not supported)',
        4: 'Source not supported'
      }
      setError(codes[v.error?.code ?? 0] || 'Stream error')
      setLoading(false)
    }

    v.addEventListener('canplay',     onCanPlay)
    v.addEventListener('play',        onPlay)
    v.addEventListener('pause',       onPause)
    v.addEventListener('timeupdate',  onTimeUpdate)
    v.addEventListener('durationchange', onDuration)
    v.addEventListener('error',       onError)

    if (url.includes('.ts')) {
      if ((window as any).mpegts) {
        playWithMpegts(url)
      } else {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/mpegts.js@latest/dist/mpegts.js'
        s.onload  = () => playWithMpegts(url)
        s.onerror = () => playWithHLS(url)
        document.head.appendChild(s)
      }
    } else if (url.includes('.m3u8')) {
      playWithHLS(url)
    } else {
      playNative(url)
    }

    return () => {
      v.removeEventListener('canplay',       onCanPlay)
      v.removeEventListener('play',          onPlay)
      v.removeEventListener('pause',         onPause)
      v.removeEventListener('timeupdate',    onTimeUpdate)
      v.removeEventListener('durationchange',onDuration)
      v.removeEventListener('error',         onError)
      hlsRef.current?.destroy();   hlsRef.current = null
      mpegtsRef.current?.destroy(); mpegtsRef.current = null
    }
  }, [url])   // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Stream helpers ─────────────────────────────────────── */
  const playWithMpegts = (streamUrl: string) => {
    const v = videoRef.current!
    const mpegts = (window as any).mpegts
    if (!mpegts) { playWithHLS(streamUrl); return }
    const p = mpegts.createPlayer({ type: 'mse', isLive: true, url: streamUrl, hasAudio: true, hasVideo: true })
    mpegtsRef.current = p
    p.attachMediaElement(v)
    p.on(mpegts.Events.ERROR, (t: string) => { setError(`Stream Error: ${t}`); setLoading(false) })
    p.load(); p.play().catch(() => {})
  }

  const playWithHLS = (streamUrl: string) => {
    const v = videoRef.current!
    if (HLS.isSupported()) {
      const hls = new HLS()
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(v)
      hls.on(HLS.Events.MANIFEST_PARSED, () => { setLoading(false); v.play().catch(() => {}) })
      hls.on(HLS.Events.ERROR, (_e, d) => {
        if (d.fatal) { setError(`HLS Error: ${d.details}`); setLoading(false) }
      })
    } else {
      playNative(streamUrl)
    }
  }

  const playNative = (streamUrl: string) => {
    const v = videoRef.current!
    v.src = streamUrl
    v.crossOrigin = 'anonymous'
  }

  /* ─── Control actions ────────────────────────────────────── */
  const togglePlay = () => {
    const v = videoRef.current;  if (!v) return
    playing ? v.pause() : v.play().catch(() => {})
    resetHideTimer()
  }

  const seek = (delta: number) => {
    const v = videoRef.current;  if (!v || isLive) return
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta))
    resetHideTimer()
  }

  const onSeekBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;  if (!v || isLive) return
    v.currentTime = (parseFloat(e.target.value) / 100) * v.duration
    setCurrentTime(v.currentTime)
  }

  const adjustVolume = (delta: number) => {
    const v = videoRef.current;  if (!v) return
    const nv = Math.max(0, Math.min(1, v.volume + delta))
    v.volume = nv;  setVolume(nv);  setMuted(nv === 0)
  }

  const onVolBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;  if (!v) return
    const nv = parseFloat(e.target.value)
    v.volume = nv;  v.muted = false;  setVolume(nv);  setMuted(nv === 0)
  }

  const toggleMute = () => {
    const v = videoRef.current;  if (!v) return
    v.muted = !v.muted;  setMuted(v.muted)
    resetHideTimer()
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen().catch(() => {})
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const volIcon = muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div
        ref={containerRef}
        className={`video-player-container ${showControls ? 'controls-visible' : 'controls-hidden'}`}
        onClick={e => e.stopPropagation()}
        onMouseMove={resetHideTimer}
      >
        {/* Close button */}
        <button className="player-close" onClick={onClose} title={t('player_close')}>✕</button>

        {/* Loading */}
        {loading && !error && (
          <div className="player-status player-loading">
            <div className="player-spinner"></div>
            <p>{t('loading_stream')}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="player-status player-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <p className="player-error-hint">{t('player_error_hint')}</p>
            <button className="retry-btn" onClick={() => { setError(null); setLoading(true) }}>
              {t('player_retry')}
            </button>
          </div>
        )}

        {/* Video */}
        <video ref={videoRef} className="video-element" onClick={togglePlay} />

        {/* Big play/pause click indicator */}
        <div className={`center-play-indicator ${playing ? 'is-play' : 'is-pause'}`}
          key={String(playing) + currentTime.toFixed(0)} />

        {/* Controls bar */}
        <div className="player-controls-bar">
          {/* Title row */}
          <div className="ctrl-title-row">
            <span className="ctrl-live-badge">{isLive ? t('player_live_badge') : t('player_playing_badge')}</span>
            <span className="ctrl-title" title={title}>{title}</span>
          </div>

          {/* Progress bar */}
          {!isLive && (
            <div className="ctrl-progress-row">
              <span className="ctrl-time">{fmt(currentTime)}</span>
              <div className="ctrl-seekbar-wrap">
                <input
                  type="range" min="0" max="100"
                  value={progress}
                  onChange={onSeekBar}
                  className="ctrl-seekbar"
                  style={{ '--val': `${progress}%` } as React.CSSProperties}
                />
              </div>
              <span className="ctrl-time">{fmt(duration)}</span>
            </div>
          )}
          {isLive && <div className="ctrl-live-bar"><div className="ctrl-live-pulse" /></div>}

          {/* Buttons row */}
          <div className="ctrl-buttons-row">
            {/* Left group */}
            <div className="ctrl-left">
              <button className="ctrl-btn ctrl-play-btn" onClick={togglePlay} title="Play/Pause (Space)">
                {playing
                  ? <svg viewBox="0 0 24 24"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>
                  : <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                }
              </button>
              {!isLive && (
                <>
                  <button className="ctrl-btn" onClick={() => seek(-10)} title="Back 10s (←)">
                    <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H4c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z"/><text x="9" y="15" fontSize="7" fill="currentColor">10</text></svg>
                  </button>
                  <button className="ctrl-btn" onClick={() => seek(10)} title="Forward 10s (→)">
                    <svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6h2c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8z"/><text x="9" y="15" fontSize="7" fill="currentColor">10</text></svg>
                  </button>
                </>
              )}
              {/* Volume */}
              <div className="ctrl-vol-group">
                <button className="ctrl-btn" onClick={toggleMute} title="Mute (M)">
                  <span style={{ fontSize: 18 }}>{volIcon}</span>
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={onVolBar}
                  className="ctrl-vol-slider"
                  style={{ '--val': `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                  title="Volume (↑↓)"
                />
              </div>
            </div>

            {/* Right group */}
            <div className="ctrl-right">
              <button className="ctrl-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                {fullscreen
                  ? <svg viewBox="0 0 24 24"><path d="M5 16H3v3a2 2 0 002 2h3v-2H5zm0-8H3V5a2 2 0 012-2h3v2H5zm16 8h-2v3h-3v2h3a2 2 0 002-2zm0-8V5a2 2 0 00-2-2h-3v2h3v3z"/></svg>
                  : <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"/></svg>
                }
              </button>
              <button className="ctrl-btn ctrl-close-btn" onClick={onClose} title="Close (Esc)">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcut hint (shown briefly) */}
        <div className="player-shortcuts-hint">
          {t('player_shortcuts')}
        </div>
      </div>
    </div>
  )
}
