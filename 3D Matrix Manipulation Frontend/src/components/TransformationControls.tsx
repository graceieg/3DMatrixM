import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RotateCcw } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export function TransformationControls() {
  const { state, dispatch } = useAppContext();

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number[]) => {
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        position: {
          ...state.transform.position,
          [axis]: value[0]
        }
      }
    });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number[]) => {
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        rotation: {
          ...state.transform.rotation,
          [axis]: (value[0] * Math.PI) / 180 // Convert to radians
        }
      }
    });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number[]) => {
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        scale: {
          ...state.transform.scale,
          [axis]: value[0]
        }
      }
    });
  };

  const handleUniformScale = (value: number[]) => {
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        scale: {
          x: value[0],
          y: value[0],
          z: value[0]
        }
      }
    });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_TRANSFORM' });
  };

  const handleInputChange = (
    type: 'position' | 'rotation' | 'scale',
    axis: 'x' | 'y' | 'z',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (type === 'rotation') {
      dispatch({
        type: 'UPDATE_TRANSFORM',
        payload: {
          [type]: {
            ...state.transform[type],
            [axis]: (numValue * Math.PI) / 180
          }
        }
      });
    } else {
      dispatch({
        type: 'UPDATE_TRANSFORM',
        payload: {
          [type]: {
            ...state.transform[type],
            [axis]: numValue
          }
        }
      });
    }
  };

  const selectedObject = state.objects.find(obj => obj.id === state.selectedObjectId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            Transformation Controls
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={!selectedObject}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedObject && (
            <p className="text-muted-foreground text-center py-4">
              Select an object to transform
            </p>
          )}
          
          {selectedObject && (
            <>
              {/* Position Controls */}
              <div className="space-y-3">
                <Label>Position</Label>
                <div className="space-y-2">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="flex items-center space-x-3">
                      <Label className="w-4 text-center">{axis.toUpperCase()}</Label>
                      <Slider
                        value={[state.transform.position[axis]]}
                        onValueChange={(value) => handlePositionChange(axis, value)}
                        min={-10}
                        max={10}
                        step={0.1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={state.transform.position[axis].toFixed(2)}
                        onChange={(e) => handleInputChange('position', axis, e.target.value)}
                        className="w-20"
                        step={0.1}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotation Controls */}
              <div className="space-y-3">
                <Label>Rotation (degrees)</Label>
                <div className="space-y-2">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="flex items-center space-x-3">
                      <Label className="w-4 text-center">{axis.toUpperCase()}</Label>
                      <Slider
                        value={[(state.transform.rotation[axis] * 180) / Math.PI]}
                        onValueChange={(value) => handleRotationChange(axis, value)}
                        min={-180}
                        max={180}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={((state.transform.rotation[axis] * 180) / Math.PI).toFixed(1)}
                        onChange={(e) => handleInputChange('rotation', axis, e.target.value)}
                        className="w-20"
                        step={1}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Scale Controls */}
              <div className="space-y-3">
                <Label>Scale</Label>
                <div className="space-y-2">
                  {/* Uniform Scale */}
                  <div className="flex items-center space-x-3">
                    <Label className="w-4 text-center">U</Label>
                    <Slider
                      value={[state.transform.scale.x]}
                      onValueChange={handleUniformScale}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={state.transform.scale.x.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          dispatch({
                            type: 'UPDATE_TRANSFORM',
                            payload: {
                              scale: { x: value, y: value, z: value }
                            }
                          });
                        }
                      }}
                      className="w-20"
                      step={0.1}
                      min={0.1}
                    />
                  </div>
                  
                  {/* Individual Scale */}
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="flex items-center space-x-3">
                      <Label className="w-4 text-center">{axis.toUpperCase()}</Label>
                      <Slider
                        value={[state.transform.scale[axis]]}
                        onValueChange={(value) => handleScaleChange(axis, value)}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={state.transform.scale[axis].toFixed(2)}
                        onChange={(e) => handleInputChange('scale', axis, e.target.value)}
                        className="w-20"
                        step={0.1}
                        min={0.1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}