export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SavedObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'plane';
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
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
