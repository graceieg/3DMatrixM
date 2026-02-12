import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Rotate3D, FunctionSquare, SquareStack } from 'lucide-react';
import { toast } from 'sonner';

type EulerOrder = 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';

interface AdvancedMatrixFeaturesProps {
  selectedObject: any;
  currentMatrix: THREE.Matrix4;
  onMatrixUpdate: (matrix: THREE.Matrix4) => void;
}

export function AdvancedMatrixFeatures({
  selectedObject,
  currentMatrix,
  onMatrixUpdate,
}: AdvancedMatrixFeaturesProps) {
  const [eulerOrder, setEulerOrder] = useState<EulerOrder>('XYZ');
  const [quaternion, setQuaternion] = useState({ x: 0, y: 0, z: 0, w: 1 });
  
  // Matrix properties
  const matrixDeterminant = currentMatrix.determinant();
  const matrixTrace = getMatrixTrace(currentMatrix);
  const matrixNorm = getMatrixNorm(currentMatrix);
  const isMatrixIdentity = isIdentity(currentMatrix);
  const isOrthogonal = checkIfOrthogonal(currentMatrix);

  // Update quaternion when matrix changes
  useEffect(() => {
    if (selectedObject) {
      const quat = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      const position = new THREE.Vector3();
      currentMatrix.decompose(position, quat, scale);
      setQuaternion({
        x: parseFloat(quat.x.toFixed(4)),
        y: parseFloat(quat.y.toFixed(4)),
        z: parseFloat(quat.z.toFixed(4)),
        w: parseFloat(quat.w.toFixed(4))
      });
    }
  }, [selectedObject, currentMatrix]);

  // Apply quaternion to object
  const applyQuaternion = () => {
    if (!selectedObject) return;
    
    const quat = new THREE.Quaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
    
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    currentMatrix.decompose(position, new THREE.Quaternion(), scale);
    
    const newMatrix = new THREE.Matrix4().compose(position, quat, scale);
    onMatrixUpdate(newMatrix);
    toast.success('Quaternion applied');
  };

  // Apply Euler angles with current order
  const applyEulerAngles = (x: number, y: number, z: number) => {
    if (!selectedObject) return;
    
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(x),
      THREE.MathUtils.degToRad(y),
      THREE.MathUtils.degToRad(z),
      eulerOrder
    );
    
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    currentMatrix.decompose(position, quat, scale);
    
    const newQuat = new THREE.Quaternion().setFromEuler(euler);
    const newMatrix = new THREE.Matrix4().compose(position, newQuat, scale);
    
    onMatrixUpdate(newMatrix);
    toast.success(`Euler angles (${eulerOrder}) applied`);
  };

  return (
    <div className="space-y-4">
      {/* Euler Angles Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Rotate3D className="w-4 h-4" />
          <h3 className="font-medium">Euler Angles ({eulerOrder})</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          {['X', 'Y', 'Z'].map((axis) => (
            <div key={axis} className="space-y-1">
              <Label className="text-xs">{axis}-Axis (degrees)</Label>
              <Input
                type="number"
                defaultValue="0"
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    const angles = { x: 0, y: 0, z: 0 };
                    angles[axis.toLowerCase() as 'x' | 'y' | 'z'] = value;
                    applyEulerAngles(angles.x, angles.y, angles.z);
                  }
                }}
                className="h-8"
                step="5"
              />
            </div>
          ))}
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Rotation Order</Label>
          <select
            value={eulerOrder}
            onChange={(e) => setEulerOrder(e.target.value as EulerOrder)}
            className="w-full p-2 text-sm border rounded"
          >
            {['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'].map((order) => (
              <option key={order} value={order}>
                {order}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Quaternion Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunctionSquare className="w-4 h-4" />
          <h3 className="font-medium">Quaternion</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          {['x', 'y', 'z', 'w'].map((component) => (
            <div key={component} className="space-y-1">
              <Label className="text-xs">{component.toUpperCase()}</Label>
              <Input
                type="number"
                value={quaternion[component as keyof typeof quaternion]}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setQuaternion(prev => ({
                      ...prev,
                      [component]: value
                    }));
                  }
                }}
                className="h-8"
                step="0.1"
              />
            </div>
          ))}
        </div>
        
        <Button
          onClick={applyQuaternion}
          className="w-full"
          variant="outline"
        >
          Apply Quaternion
        </Button>
      </div>
      
      {/* Matrix Properties Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <SquareStack className="w-4 h-4" />
          <h3 className="font-medium">Matrix Properties</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Determinant:</span>
            <span className="font-mono">{matrixDeterminant.toExponential(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trace:</span>
            <span className="font-mono">{matrixTrace.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frobenius Norm:</span>
            <span className="font-mono">{matrixNorm.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Is Identity:</span>
            <span>{isMatrixIdentity ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Is Orthogonal:</span>
            <span>{isOrthogonal ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getMatrixTrace(matrix: THREE.Matrix4): number {
  const m = matrix.elements;
  return m[0] + m[5] + m[10] + m[15];
}

function isIdentity(matrix: THREE.Matrix4): boolean {
  const identity = new THREE.Matrix4().identity();
  return matrix.equals(identity);
}

function getMatrixNorm(matrix: THREE.Matrix4): number {
  let sum = 0;
  const elements = matrix.elements;
  for (let i = 0; i < 16; i++) {
    sum += elements[i] * elements[i];
  }
  return Math.sqrt(sum);
}

function checkIfOrthogonal(matrix: THREE.Matrix4): boolean {
  const m = matrix;
  const mT = m.clone().transpose();
  const identity = new THREE.Matrix4().identity();
  mT.multiply(m);
  return mT.equals(identity);
}
