import * as THREE from 'three';

export interface SceneObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'plane';
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  matrix: THREE.Matrix4;
  color: string;
}

export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface ViewportSettings {
  showGrid: boolean;
  showAxes: boolean;
  wireframe: boolean;
  projection: 'perspective' | 'orthographic';
}

export interface AppState {
  objects: SceneObject[];
  selectedObjectId: string | null;
  transform: Transform;
  viewportSettings: ViewportSettings;
  theme: 'light' | 'dark';
}