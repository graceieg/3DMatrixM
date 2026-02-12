import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useAppContext } from '../contexts/AppContext';

export function ThreeJSViewport() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>();
  const controlsRef = useRef<OrbitControls>();
  const gridRef = useRef<THREE.GridHelper>();
  const axesRef = useRef<THREE.AxesHelper>();
  const frameRef = useRef<number>();

  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(state.theme === 'dark' ? 0x1a1a1a : 0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    
    if (state.viewportSettings.projection === 'perspective') {
      camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    } else {
      const frustumSize = 10;
      camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
      );
    }
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    gridRef.current = grid;
    if (state.viewportSettings.showGrid) {
      scene.add(grid);
    }

    // Axes
    const axes = new THREE.AxesHelper(5);
    axesRef.current = axes;
    if (state.viewportSettings.showAxes) {
      scene.add(axes);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    function handleResize() {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
      } else {
        const frustumSize = 10;
        camera.left = frustumSize * (width / height) / -2;
        camera.right = frustumSize * (width / height) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
      }
      
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    // Object click handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event: MouseEvent) {
      if (!mountRef.current || !camera || !scene) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        const sceneObject = state.objects.find(obj => obj.mesh === object);
        if (sceneObject) {
          dispatch({ type: 'SELECT_OBJECT', payload: sceneObject.id });
        }
      }
    }

    renderer.domElement.addEventListener('click', onMouseClick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [state.viewportSettings.projection, state.theme]);

  // Update scene objects
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing objects
    const objectsToRemove = sceneRef.current.children.filter(child => 
      child.userData.isSceneObject
    );
    objectsToRemove.forEach(obj => sceneRef.current!.remove(obj));

    // Add current objects
    state.objects.forEach(obj => {
      obj.mesh.userData.isSceneObject = true;
      sceneRef.current!.add(obj.mesh);
    });
  }, [state.objects]);

  // Update viewport settings
  useEffect(() => {
    if (!sceneRef.current || !gridRef.current || !axesRef.current) return;

    // Grid visibility
    if (state.viewportSettings.showGrid && !sceneRef.current.children.includes(gridRef.current)) {
      sceneRef.current.add(gridRef.current);
    } else if (!state.viewportSettings.showGrid && sceneRef.current.children.includes(gridRef.current)) {
      sceneRef.current.remove(gridRef.current);
    }

    // Axes visibility
    if (state.viewportSettings.showAxes && !sceneRef.current.children.includes(axesRef.current)) {
      sceneRef.current.add(axesRef.current);
    } else if (!state.viewportSettings.showAxes && sceneRef.current.children.includes(axesRef.current)) {
      sceneRef.current.remove(axesRef.current);
    }

    // Wireframe mode
    state.objects.forEach(obj => {
      if (obj.mesh.material instanceof THREE.Material) {
        (obj.mesh.material as any).wireframe = state.viewportSettings.wireframe;
      }
    });
  }, [state.viewportSettings, state.objects]);

  // Apply transformations to selected object
  useEffect(() => {
    if (!state.selectedObjectId) return;

    const selectedObject = state.objects.find(obj => obj.id === state.selectedObjectId);
    if (!selectedObject) return;

    selectedObject.mesh.position.set(
      state.transform.position.x,
      state.transform.position.y,
      state.transform.position.z
    );

    selectedObject.mesh.rotation.set(
      state.transform.rotation.x,
      state.transform.rotation.y,
      state.transform.rotation.z
    );

    selectedObject.mesh.scale.set(
      state.transform.scale.x,
      state.transform.scale.y,
      state.transform.scale.z
    );

    selectedObject.mesh.updateMatrix();
    
    // Update object state
    selectedObject.position.copy(selectedObject.mesh.position);
    selectedObject.rotation.copy(selectedObject.mesh.rotation);
    selectedObject.scale.copy(selectedObject.mesh.scale);
    selectedObject.matrix.copy(selectedObject.mesh.matrix);
  }, [state.transform, state.selectedObjectId, state.objects]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full bg-muted rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}