import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

function STLRenderer({ file, onError, zoomLevel }) {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const loader = new STLLoader();

    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target.result;
      const geometry = loader.parse(arrayBuffer);

      if (!geometry) {
        return;
      }

      const material = new THREE.MeshLambertMaterial({ color: 0x7f7f7f });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      meshRef.current = mesh;

      const animate = function() {
        requestAnimationFrame(animate);
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.render(scene, camera);
      };

      animate();
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
          x: prevRotation.x + deltaMove.y * 0.01,
          y: prevRotation.y + deltaMove.x * 0.01,
        }));

        setPreviousMousePosition({ x: event.clientX, y: event.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [file, onError, zoomLevel, isDragging, previousMousePosition, rotation]);

  return <canvas ref={canvasRef} width="800" height="600"></canvas>;
}

export default STLRenderer;
