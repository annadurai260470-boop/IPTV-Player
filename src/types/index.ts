export interface Channel {
  id: number | string;
  name?: string;
  title?: string;
  url?: string;
  cmd?: string;
  poster?: string;
  icon?: string;
  alias?: string;
  number?: number;
  censored?: number;
}

export interface VODItem {
  id: string;
  title: string;
  url?: string;
  poster?: string;
  alias?: string;
  categoryId?: string;
  type?: 'movie' | 'series';
  episodes?: Episode[];
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

