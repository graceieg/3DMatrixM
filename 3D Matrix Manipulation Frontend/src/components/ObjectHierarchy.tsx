import React from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Box, 
  Circle, 
  Cylinder, 
  Square,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { SceneObject } from '../types';

const objectTypes = [
  { type: 'cube' as const, label: 'Cube', icon: Box },
  { type: 'sphere' as const, label: 'Sphere', icon: Circle },
  { type: 'cylinder' as const, label: 'Cylinder', icon: Cylinder },
  { type: 'plane' as const, label: 'Plane', icon: Square },
];

const colors = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
  '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
];

function createGeometry(type: SceneObject['type']): THREE.BufferGeometry {
  switch (type) {
    case 'cube':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 32, 32);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    case 'plane':
      return new THREE.PlaneGeometry(1, 1);
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function ObjectHierarchy() {
  const { state, dispatch } = useAppContext();

  const addObject = (type: SceneObject['type']) => {
    const id = `${type}_${Date.now()}`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const geometry = createGeometry(type);
    const material = new THREE.MeshLambertMaterial({ 
      color: color,
      wireframe: state.viewportSettings.wireframe
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Random initial position to avoid overlapping
    const randomOffset = () => (Math.random() - 0.5) * 4;
    mesh.position.set(randomOffset(), randomOffset(), randomOffset());
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const sceneObject: SceneObject = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${state.objects.length + 1}`,
      type,
      mesh,
      position: mesh.position.clone(),
      rotation: mesh.rotation.clone(),
      scale: mesh.scale.clone(),
      matrix: mesh.matrix.clone(),
      color
    };

    dispatch({ type: 'ADD_OBJECT', payload: sceneObject });
    dispatch({ type: 'SELECT_OBJECT', payload: id });
  };

  const removeObject = (id: string) => {
    const obj = state.objects.find(o => o.id === id);
    if (obj) {
      obj.mesh.geometry.dispose();
      if (Array.isArray(obj.mesh.material)) {
        obj.mesh.material.forEach(mat => mat.dispose());
      } else {
        obj.mesh.material.dispose();
      }
    }
    dispatch({ type: 'REMOVE_OBJECT', payload: id });
  };

  const selectObject = (id: string) => {
    dispatch({ type: 'SELECT_OBJECT', payload: id });
  };

  const toggleObjectVisibility = (id: string) => {
    const obj = state.objects.find(o => o.id === id);
    if (obj) {
      obj.mesh.visible = !obj.mesh.visible;
    }
  };

  const getObjectIcon = (type: SceneObject['type']) => {
    const IconComponent = objectTypes.find(t => t.type === type)?.icon || Box;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Scene Objects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Object Controls */}
        <div className="grid grid-cols-2 gap-2">
          {objectTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addObject(type)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Object List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {state.objects.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No objects in scene</p>
                <p className="text-sm">Add objects using the buttons above</p>
              </div>
            ) : (
              state.objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`p-3 rounded-md border transition-colors cursor-pointer ${
                    state.selectedObjectId === obj.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                  onClick={() => selectObject(obj.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: obj.color }}
                      />
                      {getObjectIcon(obj.type)}
                      <div>
                        <p className="font-medium">{obj.name}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {obj.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleObjectVisibility(obj.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {obj.mesh.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeObject(obj.id);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {state.selectedObjectId === obj.id && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Pos:</span>
                          <br />
                          {obj.position.x.toFixed(1)}, {obj.position.y.toFixed(1)}, {obj.position.z.toFixed(1)}
                        </div>
                        <div>
                          <span className="font-medium">Rot:</span>
                          <br />
                          {((obj.rotation.x * 180) / Math.PI).toFixed(0)}°, {((obj.rotation.y * 180) / Math.PI).toFixed(0)}°, {((obj.rotation.z * 180) / Math.PI).toFixed(0)}°
                        </div>
                        <div>
                          <span className="font-medium">Scale:</span>
                          <br />
                          {obj.scale.x.toFixed(1)}, {obj.scale.y.toFixed(1)}, {obj.scale.z.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Statistics */}
        {state.objects.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {state.objects.length} object{state.objects.length !== 1 ? 's' : ''} in scene
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}