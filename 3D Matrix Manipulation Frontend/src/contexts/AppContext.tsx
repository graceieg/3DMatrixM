import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import * as THREE from 'three';
import { AppState, SceneObject, Transform, ViewportSettings } from '../types';

interface AppAction {
  type: 
    | 'ADD_OBJECT'
    | 'REMOVE_OBJECT'
    | 'SELECT_OBJECT'
    | 'UPDATE_TRANSFORM'
    | 'RESET_TRANSFORM'
    | 'UPDATE_VIEWPORT_SETTINGS'
    | 'TOGGLE_THEME'
    | 'UPDATE_OBJECT_MATRIX';
  payload?: any;
}

const initialTransform: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
};

const initialViewportSettings: ViewportSettings = {
  showGrid: true,
  showAxes: true,
  wireframe: false,
  projection: 'perspective'
};

const initialState: AppState = {
  objects: [],
  selectedObjectId: null,
  transform: initialTransform,
  viewportSettings: initialViewportSettings,
  theme: 'dark'
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_OBJECT':
      return {
        ...state,
        objects: [...state.objects, action.payload]
      };
    
    case 'REMOVE_OBJECT':
      return {
        ...state,
        objects: state.objects.filter(obj => obj.id !== action.payload),
        selectedObjectId: state.selectedObjectId === action.payload ? null : state.selectedObjectId
      };
    
    case 'SELECT_OBJECT':
      const selectedObject = state.objects.find(obj => obj.id === action.payload);
      return {
        ...state,
        selectedObjectId: action.payload,
        transform: selectedObject ? {
          position: {
            x: selectedObject.position.x,
            y: selectedObject.position.y,
            z: selectedObject.position.z
          },
          rotation: {
            x: selectedObject.rotation.x,
            y: selectedObject.rotation.y,
            z: selectedObject.rotation.z
          },
          scale: {
            x: selectedObject.scale.x,
            y: selectedObject.scale.y,
            z: selectedObject.scale.z
          }
        } : initialTransform
      };
    
    case 'UPDATE_TRANSFORM':
      return {
        ...state,
        transform: { ...state.transform, ...action.payload }
      };
    
    case 'RESET_TRANSFORM':
      return {
        ...state,
        transform: initialTransform
      };
    
    case 'UPDATE_VIEWPORT_SETTINGS':
      return {
        ...state,
        viewportSettings: { ...state.viewportSettings, ...action.payload }
      };
    
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
    
    case 'UPDATE_OBJECT_MATRIX':
      return {
        ...state,
        objects: state.objects.map(obj => 
          obj.id === action.payload.id 
            ? { ...obj, matrix: action.payload.matrix }
            : obj
        )
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}