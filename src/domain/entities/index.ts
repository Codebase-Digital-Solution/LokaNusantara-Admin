export type Role = "user" | "admin";

export interface Category {
  id: number;
  name: string;
  /** Display order in the app, lowest first. */
  position: number;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  history: string;
  /** "/uploads/..." (relative to the API) or a full URL; empty when none. */
  image_url: string;
  latitude: number;
  longitude: number;
  address: string;
  category_id: number;
  category: Category;
  created_at: string;
  updated_at: string;
}

export interface LocationInput {
  name: string;
  description: string;
  history: string;
  image_url: string;
  address: string;
  latitude: number;
  longitude: number;
  category_id: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Review {
  id: number;
  user_id: string;
  location_id: string;
  rating: number;
  comment: string;
  user?: { id: string; name: string; email: string };
  location?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface CulturalEvent {
  id: number;
  name: string;
  description: string;
  category: string;
  start_date: string;
  end_date?: string;
  is_estimate: boolean;
  region: string;
  location_id?: string;
  location?: { id: string; name: string };
}

export interface EventInput {
  name: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string | null;
  is_estimate: boolean;
  region: string;
  location_id: string | null;
}

export interface TrailStop {
  id: number;
  trail_id: number;
  position: number;
  location_id: string;
  location?: Location;
  note: string;
}

export interface Trail {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  story: string;
  color: string;
  stops: TrailStop[];
}

export interface TrailInput {
  slug: string;
  title: string;
  subtitle: string;
  story: string;
  color: string;
  stops: { location_id: string; note: string }[];
}

export interface Stats {
  locations: number;
  categories: number;
  events: number;
  trails: number;
  reviews: number;
  users: number;
  new_users_7d: number;
  new_users_30d: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url: string;
  login_method: "google" | "email";
  review_count: number;
  bookmark_count: number;
  created_at: string;
}

export interface AISettings {
  api_key_set: boolean;
  api_key_hint: string;
  api_key_source: "database" | "env" | "";
  model: string;
  max_input_chars: number;
  max_output_tokens: number;
  updated_at?: string;
}

export interface AISettingsUpdate {
  /** Omit to keep the current key. */
  api_key?: string;
  clear_api_key?: boolean;
  model: string;
  max_input_chars: number;
  max_output_tokens: number;
}

export interface UserListResponse {
  data: AdminUser[];
  daily: { day: string; count: number }[];
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface ListResponse<T> {
  data: T[];
}
