import { useEffect, useRef, useState, useMemo } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

class CustomPathTracingRenderer {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.context = canvas.getContext('webgl2');
    if (!this.context) {
      throw new Error('WebGL2 not supported');
    }
  }

  setSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.viewport(0, 0, width, height);
  }

  render(scene, camera) {
    this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    scene.children.forEach((child) => {
      if (child instanceof CustomPathTracingMaterial) {
        child.render(this.context, camera);
      }
    });
  }
}

class CustomPathTracingMaterial {
  constructor({ color }) {
    this.color = color;
  }

  render(context, camera) {
    // Custom rendering logic for path tracing material
    context.fillStyle = `#${this.color.toString(16)}`;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }
}

function STLRenderer({ file, onError, zoomLevel, performanceFactor = 0.5, viewScale, onRenderComplete }) {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);

  const loadThreeJS = async () => {
    const THREE = await import('three');
    return THREE;
  };

  const memoizedSTLRenderer = useMemo(() => {
    return async () => {
      const THREE = await loadThreeJS();
      const canvas = canvasRef.current;
      const renderer = new CustomPathTracingRenderer({ canvas });
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

        const material = new CustomPathTracingMaterial({ color: 0xd3d3d3 });
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
          if (!isRenderingComplete) {
            requestAnimationFrame(animate);
          }
          renderer.setSize(canvas.clientWidth, canvas.clientHeight);
          renderer.render(scene, camera);

          if (meshRef.current) {
            meshRef.current.rotation.x = rotation.x;
            meshRef.current.rotation.y = rotation.y;
          }
        };

        animate();
        console.log('STL file rendered successfully.');
        setIsRenderingComplete(true);
        if (onRenderComplete) {
          onRenderComplete();
        }
      };

      reader.onerror = function(error) {
        console.error('Error reading STL file:', error);
        if (onError) {
          onError(error);
        }
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
  }, [file, onError, zoomLevel, isDragging, previousMousePosition, rotation, performanceFactor, viewScale, isRenderingComplete, onRenderComplete]);

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
      canvas.width = canvas.clientWidth * performanceFactor * viewScale;
      canvas.height = canvas.clientHeight * performanceFactor * viewScale;
    }
  }, [viewScale, performanceFactor]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '800px', height: '600px' }}></canvas>;
}

export default STLRenderer;
