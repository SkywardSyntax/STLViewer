import { useEffect, useRef, useState } from 'react';

function STLRenderer({ file, onError, zoomLevel }) {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      onError('WebGL Error: Unable to initialize WebGL. Your browser or device may not support it.');
      return;
    }

    const vertexShaderSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      varying vec3 vNormal;
      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        vNormal = aNormal;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 vNormal;
      void main(void) {
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
        float lightIntensity = max(dot(vNormal, lightDirection), 0.0);
        gl_FragColor = vec4(vec3(0.5, 0.5, 0.5) * lightIntensity, 1.0);
      }
    `;

    const loadShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        onError(`WebGL Shader Compilation Error: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      return;
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      onError(`WebGL Program Linking Error: ${gl.getProgramInfoLog(shaderProgram)}`);
      return;
    }

    gl.useProgram(shaderProgram);

    const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
    const aNormal = gl.getAttribLocation(shaderProgram, 'aNormal');
    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

    const parseSTL = (arrayBuffer) => {
      const dataView = new DataView(arrayBuffer);
      const isBinary = () => {
        const reader = new FileReader();
        reader.onload = function(event) {
          const text = event.target.result;
          return text.indexOf('solid') === 0;
        };
        reader.readAsText(new Blob([arrayBuffer]));
      };

      if (isBinary()) {
        const faces = dataView.getUint32(80, true);
        const vertices = new Float32Array(faces * 9);
        const normals = new Float32Array(faces * 9);

        let offset = 84;
        for (let i = 0; i < faces; i++) {
          const normalX = dataView.getFloat32(offset, true);
          const normalY = dataView.getFloat32(offset + 4, true);
          const normalZ = dataView.getFloat32(offset + 8, true);

          for (let j = 0; j < 3; j++) {
            const vertexOffset = offset + 12 + j * 12;
            vertices[i * 9 + j * 3] = dataView.getFloat32(vertexOffset, true);
            vertices[i * 9 + j * 3 + 1] = dataView.getFloat32(vertexOffset + 4, true);
            vertices[i * 9 + j * 3 + 2] = dataView.getFloat32(vertexOffset + 8, true);

            normals[i * 9 + j * 3] = normalX;
            normals[i * 9 + j * 3 + 1] = normalY;
            normals[i * 9 + j * 3 + 2] = normalZ;
          }

          offset += 50;
        }

        return { vertices, normals };
      } else {
        onError('STL Parsing Error: ASCII STL files are not supported. Please provide a binary STL file.');
        return null;
      }
    };

    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target.result;
      const parsedData = parseSTL(arrayBuffer);

      if (!parsedData) {
        return;
      }

      const { vertices, normals } = parsedData;

      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

      const modelViewMatrix = mat4.create();
      const projectionMatrix = mat4.create();
      mat4.perspective(projectionMatrix, 75 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5]);

      const animate = function() {
        requestAnimationFrame(animate);
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.identity(modelViewMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5 * zoomLevel]);
        mat4.rotateX(modelViewMatrix, modelViewMatrix, rotation.x);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation.y);

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
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
