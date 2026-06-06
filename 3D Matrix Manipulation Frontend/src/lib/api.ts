const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface SavedObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'plane';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  visible: boolean;
}

export interface Scene {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  objects: SavedObject[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  scenes: {
    list: () => request<Scene[]>('/api/scenes'),
    get: (id: string) => request<Scene>(`/api/scenes/${id}`),
    save: (scene: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) =>
      request<Scene>('/api/scenes', { method: 'POST', body: JSON.stringify(scene) }),
    update: (id: string, patch: Partial<Pick<Scene, 'name' | 'objects'>>) =>
      request<Scene>(`/api/scenes/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
    delete: (id: string) => request<void>(`/api/scenes/${id}`, { method: 'DELETE' }),
  },
  matrix: {
    multiply: (a: number[], b: number[]) =>
      request<{ result: number[] }>('/api/matrix/multiply', {
        method: 'POST',
        body: JSON.stringify({ a, b }),
      }),
    invert: (matrix: number[]) =>
      request<{ result: number[] }>('/api/matrix/invert', {
        method: 'POST',
        body: JSON.stringify({ matrix }),
      }),
  },
};
