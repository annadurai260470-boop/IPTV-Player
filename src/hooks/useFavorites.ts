import { useState, useCallback } from 'react'

export interface FavoriteItem {
  id: string
  title: string
  image?: string
  type: 'channel' | 'movie' | 'series'
  cmd?: string
  addedAt: number
}

const STORAGE_KEY = 'iptv_favorites'

function load(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function save(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(load)

  const isFavorite = useCallback(
    (id: string) => favorites.some(f => f.id === String(id)),
    [favorites]
  )

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id)
      const next = exists
        ? prev.filter(f => f.id !== item.id)
        : [{ ...item, addedAt: Date.now() }, ...prev]
      save(next)
      return next
    })
  }, [])

  const clearFavorites = useCallback(() => {
    save([])
    setFavorites([])
  }, [])

  return { favorites, isFavorite, toggleFavorite, clearFavorites }
}
