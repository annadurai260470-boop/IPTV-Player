export interface Channel {
  id: number | string;
  name?: string;
  title?: string;
  url?: string;
  cmd?: string;
  poster?: string;
  icon?: string;
  logo?: string;  // Portal field for channel logos
  alias?: string;
  number?: number;
  censored?: number;
}

export interface VODItem {
  id: string;
  title?: string;
  name?: string;  // API returns 'name' for actual movies, 'title' for categories
  url?: string;
  cmd?: string;
  poster?: string;
  screenshot_uri?: string;  // Portal field for movie posters
  cover_big?: string;       // Portal field for covers
  img?: string;             // Portal field for images
  alias?: string;
  categoryId?: string;
  censored?: number;
  type?: 'movie' | 'series';
  episodes?: Episode[];
  year?: string;
  rating?: string;
  tmdb_rating?: string;
  description?: string;
  genre_id?: string;
  actors?: string;
  director?: string;
}

export interface Movie extends VODItem {}

export interface Series extends VODItem {}

export interface Episode {
  id: string;
  title: string;
  url: string;
}

export interface ApiResponse<T> {
  status: string;
  error?: string;
  data?: T;
}

