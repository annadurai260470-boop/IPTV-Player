import { useState, useCallback } from 'react'

export interface HistoryItem {
  id: string
  title: string
  image?: string
  type: 'channel' | 'movie' | 'series' | 'episode'
  url: string
  watchedAt: number
  progress?: number   // 0-100 percent
}

const STORAGE_KEY = 'iptv_watch_history'
const MAX_ITEMS = 20

function load(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function save(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useWatchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(load)

  const addToHistory = useCallback((item: Omit<HistoryItem, 'watchedAt'>) => {
    setHistory(prev => {
      // Remove previous entry for same id
      const filtered = prev.filter(h => h.id !== item.id)
      const next = [{ ...item, watchedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
      save(next)
      return next
    })
  }, [])

  const updateProgress = useCallback((id: string, progress: number) => {
    setHistory(prev => {
      const next = prev.map(h => h.id === id ? { ...h, progress } : h)
      save(next)
      return next
    })
  }, [])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id)
      save(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    save([])
    setHistory([])
  }, [])

  return { history, addToHistory, updateProgress, removeFromHistory, clearHistory }
}
