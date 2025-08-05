export interface UrlRow {
  short_id: string;
  original_url: string;
  click_count: number;
  created_at: Date;
  user_id?: number;
}

export interface UserRow {
  id: number;
  user_id: string;
  username: string;
  hashed_password: string;
  created_at: Date;
}

export interface ClickStatsRow {
  id: number;
  url_id: number;
  short_id: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface AggregatedStatsRow {
  country: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  count: string; // PostgreSQL returns count as string
}

export interface UrlIdRow {
  id: number;
  original_url?: string;
  click_count?: number;
}

export interface UrlShortIdRow {
  short_id: string;
  original_url: string;
  click_count: number;
} 