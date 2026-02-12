import React, { useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  RotateCcw, 
  Calculator, 
  Eye, 
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AdvancedMatrixFeatures } from './AdvancedMatrixFeatures';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'sonner';

type EulerOrder = 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';

export function MatrixPanel() {
  const { state, dispatch } = useAppContext();
  const [customMatrix, setCustomMatrix] = useState<number[]>(Array(16).fill(0));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [eulerOrder] = useState<EulerOrder>('XYZ');
  const [quaternion, setQuaternion] = useState({ x: 0, y: 0, z: 0, w: 1 });

  const selectedObject = state.objects.find(obj => obj.id === state.selectedObjectId);

  const getCurrentMatrix = (): THREE.Matrix4 => {
    if (selectedObject) {
      return selectedObject.matrix;
    }
    return new THREE.Matrix4().identity();
  };

  const currentMatrix = getCurrentMatrix();

  const formatMatrix = (matrix: THREE.Matrix4): string[][] => {
    const elements = matrix.elements;
    const formatted: string[][] = [];
    
    for (let row = 0; row < 4; row++) {
      formatted[row] = [];
      for (let col = 0; col < 4; col++) {
        const index = col * 4 + row; // Column-major order
        formatted[row][col] = elements[index].toFixed(3);
      }
    }
    
    return formatted;
  };

  const formattedMatrix = formatMatrix(currentMatrix);

  const copyMatrixToClipboard = () => {
    const text = currentMatrix.elements.map(n => n.toFixed(6)).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Matrix copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy matrix');
    });
  };

  const applyIdentityMatrix = () => {
    if (!selectedObject) return;
    
    const identityMatrix = new THREE.Matrix4().identity();
    selectedObject.mesh.matrix.copy(identityMatrix);
    selectedObject.mesh.matrixAutoUpdate = false;
    selectedObject.mesh.updateMatrixWorld(true);
    
    // Update transform state
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    });
    
    toast.success('Identity matrix applied');
  };

  const invertMatrix = () => {
    if (!selectedObject) return;
    
    const inverseMatrix = new THREE.Matrix4().copy(selectedObject.mesh.matrix).invert();
    
    // If determinant is 0, matrix is not invertible
    if (inverseMatrix.determinant() === 0) {
      toast.error('Matrix is not invertible (determinant is 0)');
      return;
    }
    
    selectedObject.mesh.matrix.copy(inverseMatrix);
    selectedObject.mesh.matrixAutoUpdate = false;
    selectedObject.mesh.updateMatrixWorld(true);
    
    // Update transform state
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    inverseMatrix.decompose(position, quaternion, scale);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: euler.x, y: euler.y, z: euler.z },
        scale: { x: scale.x, y: scale.y, z: scale.z }
      }
    });
    
    toast.success('Matrix inverted');
  };

  const applyLookAtMatrix = () => {
    if (!selectedObject) return;
    
    const position = new THREE.Vector3(
      selectedObject.mesh.position.x,
      selectedObject.mesh.position.y,
      selectedObject.mesh.position.z
    );
    
    const target = new THREE.Vector3(0, 0, 0);
    const up = new THREE.Vector3(0, 1, 0);
    
    const lookAtMatrix = new THREE.Matrix4().lookAt(position, target, up);
    selectedObject.mesh.matrix.copy(lookAtMatrix);
    selectedObject.mesh.matrixAutoUpdate = false;
    selectedObject.mesh.updateMatrixWorld(true);
    
    // Update transform state
    const newPosition = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    lookAtMatrix.decompose(newPosition, quaternion, scale);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        position: { x: newPosition.x, y: newPosition.y, z: newPosition.z },
        rotation: { x: euler.x, y: euler.y, z: euler.z },
        scale: { x: scale.x, y: scale.y, z: scale.z }
      }
    });
    
    toast.success('Look-at matrix applied');
  };

  // Matrix properties
  const matrixDeterminant = currentMatrix.determinant();
  const isOrthogonal = (() => {
    const m = currentMatrix;
    const mT = m.clone().transpose();
    const identity = new THREE.Matrix4().identity();
    mT.multiply(m);
    return mT.equals(identity);
  })();

  // Handle matrix updates from child components
  const handleMatrixUpdate = (newMatrix: THREE.Matrix4) => {
    if (!selectedObject) return;
    
    selectedObject.mesh.matrix.copy(newMatrix);
    selectedObject.mesh.matrixAutoUpdate = false;
    selectedObject.mesh.updateMatrixWorld(true);
    
    // Update transform state
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    newMatrix.decompose(position, quaternion, scale);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: euler.x, y: euler.y, z: euler.z },
        scale: { x: scale.x, y: scale.y, z: scale.z }
      }
    });
  };

  // Check if matrix is identity
  const isIdentity = (): boolean => {
    const identity = new THREE.Matrix4().identity();
    return currentMatrix.equals(identity);
  };

  // Get matrix trace
  const getMatrixTrace = (): number => {
    const m = currentMatrix.elements;
    return m[0] + m[5] + m[10] + m[15];
  };

  // Get matrix norm (Frobenius norm)
  const getMatrixNorm = (): number => {
    let sum = 0;
    const elements = currentMatrix.elements;
    for (let i = 0; i < 16; i++) {
      sum += elements[i] * elements[i];
    }
    return Math.sqrt(sum);
  };

  // Handle custom matrix input change
  const handleCustomMatrixChange = (index: number, value: string) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue)) {
      const newMatrix = [...customMatrix];
      newMatrix[index] = newValue;
      setCustomMatrix(newMatrix);
    }
  };

  // Apply custom matrix
  const applyCustomMatrix = () => {
    if (!selectedObject) return;
    
    const matrix = new THREE.Matrix4();
    matrix.set(
      customMatrix[0], customMatrix[4], customMatrix[8], customMatrix[12],
      customMatrix[1], customMatrix[5], customMatrix[9], customMatrix[13],
      customMatrix[2], customMatrix[6], customMatrix[10], customMatrix[14],
      customMatrix[3], customMatrix[7], customMatrix[11], customMatrix[15]
    );
    
    selectedObject.mesh.matrix.copy(matrix);
    selectedObject.mesh.matrixAutoUpdate = false;
    selectedObject.mesh.updateMatrixWorld(true);
    
    // Update transform state
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, quaternion, scale);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    dispatch({
      type: 'UPDATE_TRANSFORM',
      payload: {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: euler.x, y: euler.y, z: euler.z },
        scale: { x: scale.x, y: scale.y, z: scale.z }
      }
    });
    
    toast.success('Custom matrix applied');
  };

  // Load current matrix into custom matrix
  const loadCurrentMatrix = () => {
    if (!selectedObject) return;
    setCustomMatrix(Array.from(selectedObject.matrix.elements));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Matrix Panel</span>
          <Button
            variant="outline"
            size="sm"
            onClick={copyMatrixToClipboard}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Matrix
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Matrix Operations</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs gap-1"
                >
                  {showAdvanced ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Hide Advanced
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show Advanced
                    </>
                  )}
                </Button>
              </div>
              
              {showAdvanced && selectedObject && (
                <div className="mt-4">
                  <AdvancedMatrixFeatures
                    selectedObject={selectedObject}
                    currentMatrix={currentMatrix}
                    onMatrixUpdate={handleMatrixUpdate}
                  />
                </div>
              )}
              
              <div className="bg-muted p-3 rounded-md">
                <div className="grid grid-cols-4 gap-1 font-mono text-sm">
                  {formattedMatrix.map((row, rowIndex) =>
                    row.map((value, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="text-center p-1 bg-background rounded border"
                      >
                        {value}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={applyIdentityMatrix}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Apply Identity
                </Button>
                
                <Button
                  variant="outline"
                  onClick={invertMatrix}
                  disabled={!selectedObject || Math.abs(matrixDeterminant) < 0.001}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Invert Matrix
                </Button>
                
                <Button
                  variant="outline"
                  onClick={applyLookAtMatrix}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Look At Origin
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedObject) return;
                    
                    // Create a new rotation matrix for 45 degrees around Y axis
                    const rotationMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 4);
                    
                    // Apply rotation to the current matrix
                    selectedObject.mesh.matrix.multiply(rotationMatrix);
                    selectedObject.mesh.matrixAutoUpdate = false;
                    selectedObject.mesh.updateMatrixWorld(true);
                    
                    // Decompose the matrix to update position, rotation, and scale
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    selectedObject.mesh.matrix.decompose(position, quaternion, scale);
                    const euler = new THREE.Euler().setFromQuaternion(quaternion);
                    
                    // Update the transform state
                    dispatch({
                      type: 'UPDATE_TRANSFORM',
                      payload: {
                        position: { x: position.x, y: position.y, z: position.z },
                        rotation: { x: euler.x, y: euler.y, z: euler.z },
                        scale: { x: scale.x, y: scale.y, z: scale.z }
                      }
                    });
                    
                    selectedObject.mesh.matrixAutoUpdate = true;
                    toast.success('45° Y rotation applied');
                  }}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  Rotate Y 45°
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedObject) return;
                    
                    // Create a new scale matrix for 2x scale
                    const scaleMatrix = new THREE.Matrix4().makeScale(2, 2, 2);
                    
                    // Apply scale to the current matrix
                    selectedObject.mesh.matrix.multiply(scaleMatrix);
                    selectedObject.mesh.matrixAutoUpdate = false;
                    selectedObject.mesh.updateMatrixWorld(true);
                    
                    // Decompose the matrix to update position, rotation, and scale
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    selectedObject.mesh.matrix.decompose(position, quaternion, scale);
                    const euler = new THREE.Euler().setFromQuaternion(quaternion);
                    
                    // Update the transform state
                    dispatch({
                      type: 'UPDATE_TRANSFORM',
                      payload: {
                        position: { x: position.x, y: position.y, z: position.z },
                        rotation: { x: euler.x, y: euler.y, z: euler.z },
                        scale: { x: scale.x, y: scale.y, z: scale.z }
                      }
                    });
                    
                    selectedObject.mesh.matrixAutoUpdate = true;
                    toast.success('2x scale applied');
                  }}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  Scale 2x
                </Button>
              </div>
              
              {showAdvanced && selectedObject && (
                <div className="border-t border-border/50 pt-4 mt-4">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    Matrix Properties
                  </Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Determinant:</span>
                      <span className="font-mono">{matrixDeterminant.toExponential(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trace:</span>
                      <span className="font-mono">
                        {getMatrixTrace().toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frobenius Norm:</span>
                      <span className="font-mono">{getMatrixNorm().toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Is Identity:</span>
                      <span>{isIdentity() ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Is Orthogonal:</span>
                      <span>{isOrthogonal ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="operations" className="space-y-4">
            <div className="space-y-3">
              <Label>Matrix Operations</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={applyIdentityMatrix}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Apply Identity
                </Button>
                
                <Button
                  variant="outline"
                  onClick={invertMatrix}
                  disabled={!selectedObject || Math.abs(matrixDeterminant) < 0.001}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Invert Matrix
                </Button>
                
                <Button
                  variant="outline"
                  onClick={applyLookAtMatrix}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Look At Origin
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedObject) return;
                    
                    // Create a new rotation matrix for 45 degrees around Y axis
                    const rotationMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 4);
                    
                    // Apply rotation to the current matrix
                    selectedObject.mesh.matrix.multiply(rotationMatrix);
                    selectedObject.mesh.matrixAutoUpdate = false;
                    selectedObject.mesh.updateMatrixWorld(true);
                    
                    // Decompose the matrix to update position, rotation, and scale
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    selectedObject.mesh.matrix.decompose(position, quaternion, scale);
                    const euler = new THREE.Euler().setFromQuaternion(quaternion);
                    
                    // Update the transform state
                    dispatch({
                      type: 'UPDATE_TRANSFORM',
                      payload: {
                        position: { x: position.x, y: position.y, z: position.z },
                        rotation: { x: euler.x, y: euler.y, z: euler.z },
                        scale: { x: scale.x, y: scale.y, z: scale.z }
                      }
                    });
                    
                    selectedObject.mesh.matrixAutoUpdate = true;
                    toast.success('45° Y rotation applied');
                  }}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  Rotate Y 45°
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedObject) return;
                    
                    // Create a new scale matrix for 2x scale
                    const scaleMatrix = new THREE.Matrix4().makeScale(2, 2, 2);
                    
                    // Apply scale to the current matrix
                    selectedObject.mesh.matrix.multiply(scaleMatrix);
                    selectedObject.mesh.matrixAutoUpdate = false;
                    selectedObject.mesh.updateMatrixWorld(true);
                    
                    // Decompose the matrix to update position, rotation, and scale
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    selectedObject.mesh.matrix.decompose(position, quaternion, scale);
                    const euler = new THREE.Euler().setFromQuaternion(quaternion);
                    
                    // Update the transform state
                    dispatch({
                      type: 'UPDATE_TRANSFORM',
                      payload: {
                        position: { x: position.x, y: position.y, z: position.z },
                        rotation: { x: euler.x, y: euler.y, z: euler.z },
                        scale: { x: scale.x, y: scale.y, z: scale.z }
                      }
                    });
                    
                    selectedObject.mesh.matrixAutoUpdate = true;
                    toast.success('2x scale applied');
                  }}
                  disabled={!selectedObject}
                  className="flex items-center gap-2"
                >
                  Scale 2x
                </Button>
              </div>
              
              {showAdvanced && selectedObject && (
                <div className="mt-4">
                  <AdvancedMatrixFeatures
                    selectedObject={selectedObject}
                    currentMatrix={currentMatrix}
                    onMatrixUpdate={handleMatrixUpdate}
                  />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custom Matrix</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCurrentMatrix}
                    disabled={!selectedObject}
                  >
                    Load Current
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyCustomMatrix}
                    disabled={!selectedObject}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {customMatrix.map((value, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      m{Math.floor(index / 4)}{index % 4}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => handleCustomMatrixChange(index, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Enter matrix values in column-major order (m00, m10, m20, m30, m01, ...)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
