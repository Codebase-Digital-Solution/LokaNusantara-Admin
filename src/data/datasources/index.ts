import { apiClient } from "@/core/api/apiClient";
import type {
  AISettings,
  AISettingsUpdate,
  AuthResponse,
  UserListResponse,
  Category,
  CulturalEvent,
  EventInput,
  ListResponse,
  Location,
  LocationInput,
  Review,
  Stats,
  Trail,
  TrailInput,
} from "@/domain/entities";

// Admin lists load everything at once; the dataset is small (hundreds of rows).
const ALL = 1000;

export const authDatasource = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    return data;
  },
};

export const statsDatasource = {
  get: async (): Promise<Stats> => (await apiClient.get<Stats>("/admin/stats")).data,
};

export const userDatasource = {
  getAll: async (): Promise<UserListResponse> => (await apiClient.get<UserListResponse>("/admin/users")).data,
};

export const aiSettingsDatasource = {
  get: async (): Promise<AISettings> => (await apiClient.get<AISettings>("/admin/settings/ai")).data,
  update: async (input: AISettingsUpdate): Promise<AISettings> =>
    (await apiClient.put<AISettings>("/admin/settings/ai", input)).data,
  test: async (): Promise<void> => {
    await apiClient.post("/admin/settings/ai/test");
  },
};

export const locationDatasource = {
  getAll: async (): Promise<Location[]> =>
    (await apiClient.get<ListResponse<Location>>("/locations", { params: { limit: ALL } })).data.data,
  getById: async (id: string): Promise<Location> => (await apiClient.get<Location>(`/locations/${id}`)).data,
  create: async (input: LocationInput): Promise<Location> =>
    (await apiClient.post<Location>("/locations", input)).data,
  update: async (id: string, input: LocationInput): Promise<Location> =>
    (await apiClient.put<Location>(`/locations/${id}`, input)).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/locations/${id}`);
  },
  /** Uploads a photo and returns its stored path ("/uploads/..."). */
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ url: string }>("/admin/uploads/location-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
    return data.url;
  },
};

export const categoryDatasource = {
  getAll: async (): Promise<Category[]> =>
    (await apiClient.get<ListResponse<Category>>("/categories", { params: { limit: ALL } })).data.data,
  create: async (name: string): Promise<Category> =>
    (await apiClient.post<Category>("/categories", { name })).data,
  update: async (id: number, name: string): Promise<Category> =>
    (await apiClient.put<Category>(`/categories/${id}`, { name })).data,
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
  /** Saves the display order; ids must list every category once. */
  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put("/categories/order", { ids });
  },
};

export const eventDatasource = {
  getAll: async (): Promise<CulturalEvent[]> =>
    (await apiClient.get<ListResponse<CulturalEvent>>("/admin/events")).data.data,
  create: async (input: EventInput): Promise<CulturalEvent> =>
    (await apiClient.post<CulturalEvent>("/events", input)).data,
  update: async (id: number, input: EventInput): Promise<CulturalEvent> =>
    (await apiClient.put<CulturalEvent>(`/events/${id}`, input)).data,
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },
};

export const trailDatasource = {
  getAll: async (): Promise<Trail[]> => (await apiClient.get<ListResponse<Trail>>("/trails")).data.data,
  create: async (input: TrailInput): Promise<Trail> => (await apiClient.post<Trail>("/trails", input)).data,
  update: async (id: number, input: TrailInput): Promise<Trail> =>
    (await apiClient.put<Trail>(`/trails/${id}`, input)).data,
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/trails/${id}`);
  },
};

export const reviewDatasource = {
  getAll: async (): Promise<Review[]> =>
    (await apiClient.get<ListResponse<Review>>("/admin/reviews", { params: { limit: 500 } })).data.data,
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/reviews/${id}`);
  },
};
