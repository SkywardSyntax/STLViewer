import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { debounce } from 'lodash';

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

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = function(event) {
      try {
        const arrayBuffer = event.target.result;
        const geometry = loader.parse(arrayBuffer);
        const material = new THREE.MeshPhongMaterial({ color: 0x555555, specular: 0x111111, shininess: 200 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;

        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

        camera.position.z = cameraZ;

        const minZ = boundingBox.min.z;
        const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

        camera.far = cameraToFarEdge * 3;
        camera.updateProjectionMatrix();

        camera.lookAt(center);

        const animate = function() {
          requestAnimationFrame(animate);
          renderer.setSize(canvas.clientWidth, canvas.clientHeight);
          camera.position.z = cameraZ * zoomLevel;

          if (meshRef.current) {
            meshRef.current.rotation.x = rotation.x;
            meshRef.current.rotation.y = rotation.y;
          }

          // Frustum culling
          const frustum = new THREE.Frustum();
          const cameraViewProjectionMatrix = new THREE.Matrix4();
          camera.updateMatrixWorld();
          camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
          cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
          frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

          if (meshRef.current) {
            meshRef.current.visible = frustum.intersectsObject(meshRef.current);
          }

          renderer.render(scene, camera);
        };

        animate();
      } catch (error) {
        onError(`Three.js Error: ${error.message}`);
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
