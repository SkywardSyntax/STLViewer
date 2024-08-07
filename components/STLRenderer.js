import { useEffect, useRef, useState, useMemo } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PathTracingRenderer, PathTracingMaterial } from 'three/examples/jsm/renderers/PathTracingRenderer.js';

function STLRenderer({ file, onError, zoomLevel, performanceFactor = 0.5, viewScale }) {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const loadThreeJS = async () => {
    const THREE = await import('three');
    return THREE;
  };

  const memoizedSTLRenderer = useMemo(() => {
    return async () => {
      const THREE = await loadThreeJS();
      const canvas = canvasRef.current;
      const renderer = new PathTracingRenderer({ canvas });
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      camera.position.z = 5;

      const loader = new STLLoader();

      const reader = new FileReader();
      reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const geometry = loader.parse(arrayBuffer);

        if (!geometry) {
          console.error('Failed to parse STL file.');
          return;
        }

        const material = new PathTracingMaterial({ color: 0xd3d3d3 });
        const mesh = new THREE.InstancedMesh(geometry, material, 1);
        scene.add(mesh);
        meshRef.current = mesh;

        // Optimization: Frustum Culling
        mesh.frustumCulled = true;

        // Optimization: Level of Detail (LOD)
        const lod = new THREE.LOD();
        lod.addLevel(mesh, 0);
        scene.add(lod);

        // Initialize mesh scale to a more appropriate value
        mesh.scale.set(1, 1, 1);

        const animate = function() {
          requestAnimationFrame(animate);
          renderer.setSize(canvas.clientWidth, canvas.clientHeight);
          renderer.render(scene, camera);

          if (meshRef.current) {
            meshRef.current.rotation.x = rotation.x;
            meshRef.current.rotation.y = rotation.y;
          }
        };

        animate();
        console.log('STL file rendered successfully.');
      };

      reader.readAsArrayBuffer(file);

      const handleMouseDown = (event) => {
        setIsDragging(true);
        setPreviousMousePosition({ x: event.clientX, y: event.clientY });
      };

      const handleMouseMove = (event) => {
        if (isDragging) {
          const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
          };

          setRotation((prevRotation) => ({
            x: prevRotation.x + deltaMove.y * 0.05,
            y: prevRotation.y + deltaMove.x * 0.05,
          }));

          setPreviousMousePosition({ x: event.clientX, y: event.clientY });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      const handleResize = () => {
        const canvas = canvasRef.current;
        if (canvas && renderer && camera) {
          const width = canvas.clientWidth * viewScale;
          const height = canvas.clientHeight * viewScale;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      };

      window.addEventListener('resize', handleResize);

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
      };
    };
  }, [file, onError, zoomLevel, isDragging, previousMousePosition, rotation, performanceFactor, viewScale]);

  useEffect(() => {
    memoizedSTLRenderer();
  }, [memoizedSTLRenderer]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotation.x;
      meshRef.current.rotation.y = rotation.y;
    }
  }, [rotation]);

  useEffect(() => {
    if (meshRef.current) {
      const scale = Math.pow(2, zoomLevel / 10);
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [zoomLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 400 * performanceFactor * viewScale;
      canvas.height = 300 * performanceFactor * viewScale;
    }
  }, [viewScale, performanceFactor]);

  return <canvas ref={canvasRef}></canvas>;
}

export default STLRenderer;
