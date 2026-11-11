export type Role = "user" | "admin";

export interface Category {
  id: number;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  history: string;
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
  review_count: number;
  created_at: string;
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
