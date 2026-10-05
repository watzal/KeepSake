export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

export type Member = { name: string; role: string; is_me: boolean };

export type Recap = {
  script: string;
  ai_written: boolean;
  audio_url: string | null;
  audio_error: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  photo_count: number;
  contributors?: string[];
  members: Member[];
  invite_token: string;
  recap?: Recap;
  processing?: Processing | null;
};

export type TripSummary = { id: string; name: string; photo_count: number; member_count: number };

export type Processing = {
  status: "running" | "done" | "failed";
  stage: "embedding" | "clustering" | "naming";
  done: number;
  total: number;
  error: string | null;
};

export type Photo = {
  id: string;
  event_id: string | null;
  filename: string;
  contributor: string;
  url: string;
  thumb_url: string;
  taken_at: string | null;
  width: number;
  height: number;
};

export type TripEvent = {
  id: string;
  name: string;
  description: string;
  photo_count: number;
  contributors: string[];
  start_time: string | null;
  end_time: string | null;
  named_by_ai?: boolean;
  photos: Photo[];
};

export type UploadResult = {
  saved: Photo[];
  duplicates: string[];
  failed: { filename: string; reason: string }[];
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken ? await getToken() : null;
  if (!token) throw new Error("Sign in to continue");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function createTrip(input: { name: string; display_name: string }) {
  return request<Trip>("/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export const listTrips = () => request<TripSummary[]>("/trips");

export function joinTrip(token: string, display_name: string) {
  return request<{ id: string }>("/trips/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, display_name }),
  });
}

export const getTrip = (id: string) => request<Trip>(`/trips/${id}`);

export const listPhotos = (id: string) => request<Photo[]>(`/trips/${id}/photos`);

export const listEvents = (id: string) => request<TripEvent[]>(`/trips/${id}/events`);

export const processTrip = (id: string) =>
  request<Processing>(`/trips/${id}/process`, { method: "POST" });

export type SearchHit = Photo & { score: number };

export type SearchResponse = {
  query: string;
  method: "atlas" | "local";
  results: SearchHit[];
};

export const searchPhotos = (id: string, q: string) =>
  request<SearchResponse>(`/trips/${id}/search?q=${encodeURIComponent(q)}`);

export const createRecap = (id: string) => request<Recap>(`/trips/${id}/recap`, { method: "POST" });

export function uploadPhotos(id: string, files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return request<UploadResult>(`/trips/${id}/photos`, { method: "POST", body: form });
}
