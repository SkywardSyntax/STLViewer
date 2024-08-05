import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

function STLRenderer({ file, onError }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = function(event) {
      try {
        const arrayBuffer = event.target.result;
        const geometry = loader.parse(arrayBuffer);
        const material = new THREE.MeshNormalMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.render(scene, camera);
      } catch (error) {
        onError(`Three.js Error: ${error.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [file, onError]);

  return <canvas ref={canvasRef} width="800" height="600"></canvas>;
}

export default STLRenderer;
