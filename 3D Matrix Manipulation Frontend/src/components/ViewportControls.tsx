import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Grid3X3, 
  Axis3D, 
  Network, 
  Camera,
  Sun,
  Moon
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export function ViewportControls() {
  const { state, dispatch } = useAppContext();

  const toggleGrid = () => {
    dispatch({
      type: 'UPDATE_VIEWPORT_SETTINGS',
      payload: { showGrid: !state.viewportSettings.showGrid }
    });
  };

  const toggleAxes = () => {
    dispatch({
      type: 'UPDATE_VIEWPORT_SETTINGS',
      payload: { showAxes: !state.viewportSettings.showAxes }
    });
  };

  const toggleWireframe = () => {
    dispatch({
      type: 'UPDATE_VIEWPORT_SETTINGS',
      payload: { wireframe: !state.viewportSettings.wireframe }
    });
  };

  const toggleProjection = () => {
    dispatch({
      type: 'UPDATE_VIEWPORT_SETTINGS',
      payload: { 
        projection: state.viewportSettings.projection === 'perspective' 
          ? 'orthographic' 
          : 'perspective' 
      }
    });
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    
    // Apply theme to document
    if (state.theme === 'light') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          Viewport Controls
          <Badge variant="outline">
            {state.viewportSettings.projection}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display Settings */}
        <div className="space-y-3">
          <Label>Display</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                <Label htmlFor="grid-toggle">Grid</Label>
              </div>
              <Switch
                id="grid-toggle"
                checked={state.viewportSettings.showGrid}
                onCheckedChange={toggleGrid}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Axis3D className="w-4 h-4" />
                <Label htmlFor="axes-toggle">Axes</Label>
              </div>
              <Switch
                id="axes-toggle"
                checked={state.viewportSettings.showAxes}
                onCheckedChange={toggleAxes}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                <Label htmlFor="wireframe-toggle">Wireframe</Label>
              </div>
              <Switch
                id="wireframe-toggle"
                checked={state.viewportSettings.wireframe}
                onCheckedChange={toggleWireframe}
              />
            </div>
          </div>
        </div>

        {/* Camera Settings */}
        <div className="space-y-3">
          <Label>Camera</Label>
          <Button
            variant="outline"
            onClick={toggleProjection}
            className="w-full flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {state.viewportSettings.projection === 'perspective' 
              ? 'Switch to Orthographic' 
              : 'Switch to Perspective'}
          </Button>
        </div>

        {/* Theme Settings */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.theme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <Label htmlFor="theme-toggle">
                {state.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={state.theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-3 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">Controls</Label>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <p>• Left click + drag: Rotate camera</p>
            <p>• Right click + drag: Pan camera</p>
            <p>• Scroll: Zoom in/out</p>
            <p>• Click object: Select</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}