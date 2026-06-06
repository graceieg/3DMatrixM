import { Scene } from './types.js';

// In-memory store — swap out for a database (SQLite, Postgres, etc.) later
const scenes = new Map<string, Scene>();

export function listScenes(): Scene[] {
  return Array.from(scenes.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getScene(id: string): Scene | undefined {
  return scenes.get(id);
}

export function saveScene(scene: Scene): Scene {
  scenes.set(scene.id, scene);
  return scene;
}

export function deleteScene(id: string): boolean {
  return scenes.delete(id);
}
