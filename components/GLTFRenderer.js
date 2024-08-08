import { useEffect, useRef, useState, useMemo } from 'react';
import { mat4, vec3 } from 'gl-matrix';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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

function GLTFRenderer({ file, onError, zoomLevel, performanceFactor = 0.5, viewScale, onRenderComplete }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);

  const memoizedGLTFRenderer = useMemo(() => {
    return async () => {
      const canvas = canvasRef.current;
      const renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(10, 10, 10);
      scene.add(light);

      const loader = new GLTFLoader();
      loader.load(
        URL.createObjectURL(file),
        (gltf) => {
          const model = gltf.scene;
          scene.add(model);
          meshRef.current = model;
          animate();
          console.log('glTF file rendered successfully.');
          setIsRenderingComplete(true);
          if (onRenderComplete) {
            onRenderComplete();
          }
        },
        undefined,
        (error) => {
          console.error('Error loading glTF file:', error);
          if (onError) {
            onError(error);
          }
        }
      );

      const animate = function() {
        if (!isRenderingComplete) {
          requestAnimationFrame(animate);
        }
        renderer.render(scene, camera);
        if (meshRef.current) {
          meshRef.current.rotation.x = rotation.x;
          meshRef.current.rotation.y = rotation.y;
        }
      };

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
        if (canvas && renderer) {
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
    memoizedGLTFRenderer();
  }, [memoizedGLTFRenderer]);

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
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.setSize(canvas.clientWidth * performanceFactor * viewScale, canvas.clientHeight * performanceFactor * viewScale);
      }
    }
  }, [viewScale, performanceFactor]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.clientWidth * viewScale;
        const height = canvas.clientHeight * viewScale;
        const renderer = rendererRef.current;
        if (renderer) {
          renderer.setSize(width, height);
          const camera = cameraRef.current;
          if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewScale]);

  useEffect(() => {
    const handleViewScaleChange = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.clientWidth * viewScale;
        const height = canvas.clientHeight * viewScale;
        const renderer = rendererRef.current;
        if (renderer) {
          renderer.setSize(width, height);
          const camera = cameraRef.current;
          if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }
      }
    };

    handleViewScaleChange();
  }, [viewScale]);

  return <canvas ref={canvasRef} style={{ width: '800px', height: '600px' }}></canvas>;
}

export default GLTFRenderer;
