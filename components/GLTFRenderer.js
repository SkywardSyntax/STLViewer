import { useEffect, useRef, useState, useMemo } from 'react';
import { mat4, vec3 } from 'gl-matrix';

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

function parseGLTF(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const jsonChunkLength = dataView.getUint32(12, true);
  if (arrayBuffer.byteLength < 20 + jsonChunkLength) {
    throw new RangeError('Length out of range of buffer');
  }
  const jsonChunkData = new Uint8Array(arrayBuffer, 20, jsonChunkLength);
  const jsonString = new TextDecoder().decode(jsonChunkData);
  const gltf = JSON.parse(jsonString);

  const bufferViews = gltf.bufferViews;
  const accessors = gltf.accessors;
  const meshes = gltf.meshes;

  const vertices = [];
  const indices = [];

  meshes.forEach((mesh) => {
    mesh.primitives.forEach((primitive) => {
      const positionAccessor = accessors[primitive.attributes.POSITION];
      const indexAccessor = accessors[primitive.indices];

      const positionBufferView = bufferViews[positionAccessor.bufferView];
      const indexBufferView = bufferViews[indexAccessor.bufferView];

      if (arrayBuffer.byteLength < positionBufferView.byteOffset + positionAccessor.count * 3 * 4) {
        throw new RangeError('Length out of range of buffer');
      }
      if (arrayBuffer.byteLength < indexBufferView.byteOffset + indexAccessor.count * 2) {
        throw new RangeError('Length out of range of buffer');
      }

      const positionData = new Float32Array(arrayBuffer, positionBufferView.byteOffset, positionAccessor.count * 3);
      const indexData = new Uint16Array(arrayBuffer, indexBufferView.byteOffset, indexAccessor.count);

      vertices.push(...positionData);
      indices.push(...indexData);
    });
  });

  return { vertices, indices };
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

function GLTFRenderer({ file, onError, zoomLevel, performanceFactor = 0.5, viewScale, onRenderComplete }) {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);

  const memoizedGLTFRenderer = useMemo(() => {
    return async () => {
      const canvas = canvasRef.current;
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        throw new Error('WebGL2 not supported');
      }

      const vertexShaderSource = `
        precision mediump float;
        attribute vec3 aVertexPosition;
        attribute vec3 aVertexNormal;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform vec3 uLightPosition;
        varying highp vec3 vLighting;
        void main(void) {
          gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
          highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
          highp vec3 directionalLightColor = vec3(1, 1, 1);
          highp vec3 directionalVector = normalize(uLightPosition - aVertexPosition);
          highp float directional = max(dot(aVertexNormal, directionalVector), 0.0);
          vLighting = ambientLight + (directionalLightColor * directional);
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying highp vec3 vLighting;
        uniform vec3 uLightColor;
        void main(void) {
          gl_FragColor = vec4(vLighting * uLightColor, 1.0);
        }
      `;

      const shaderProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
      const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
          vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
          lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
          lightColor: gl.getUniformLocation(shaderProgram, 'uLightColor'),
        },
      };

      const reader = new FileReader();
      reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        try {
          const { vertices, indices } = parseGLTF(arrayBuffer);

          const vertexBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

          const indexBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

          const buffers = {
            position: vertexBuffer,
            indices: indexBuffer,
          };

          const scene = {
            children: [
              {
                buffers,
                vertexCount: indices.length,
                render: (gl, programInfo, projectionMatrix, modelViewMatrix) => {
                  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
                  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
                  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

                  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

                  gl.useProgram(programInfo.program);
                  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
                  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
                  gl.uniform3fv(programInfo.uniformLocations.lightPosition, [10, 10, 10]);
                  gl.uniform3fv(programInfo.uniformLocations.lightColor, [1, 1, 1]);

                  gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);
                },
              },
            ],
          };

          const camera = {
            position: vec3.fromValues(0, 0, 5),
            projectionMatrix: mat4.create(),
            modelViewMatrix: mat4.create(),
          };

          mat4.perspective(camera.projectionMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
          mat4.translate(camera.modelViewMatrix, camera.modelViewMatrix, camera.position);

          const animate = function() {
            if (!isRenderingComplete) {
              requestAnimationFrame(animate);
            }
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            scene.children.forEach((child) => {
              child.render(gl, programInfo, camera.projectionMatrix, camera.modelViewMatrix);
            });

            if (meshRef.current) {
              mat4.rotateX(camera.modelViewMatrix, camera.modelViewMatrix, rotation.x);
              mat4.rotateY(camera.modelViewMatrix, camera.modelViewMatrix, rotation.y);
            }
          };

          animate();
          console.log('glTF file rendered successfully.');
          setIsRenderingComplete(true);
          if (onRenderComplete) {
            onRenderComplete();
          }
        } catch (error) {
          console.error('Error parsing glTF file:', error);
          if (onError) {
            onError(error);
          }
        }
      };

      reader.onerror = function(error) {
        console.error('Error reading glTF file:', error);
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
        if (canvas && gl) {
          const width = canvas.clientWidth * viewScale;
          const height = canvas.clientHeight * viewScale;
          gl.viewport(0, 0, width, height);
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
      mat4.rotateX(meshRef.current.modelViewMatrix, meshRef.current.modelViewMatrix, rotation.x);
      mat4.rotateY(meshRef.current.modelViewMatrix, meshRef.current.modelViewMatrix, rotation.y);
    }
  }, [rotation]);

  useEffect(() => {
    if (meshRef.current) {
      const scale = Math.pow(2, zoomLevel / 10);
      mat4.scale(meshRef.current.modelViewMatrix, meshRef.current.modelViewMatrix, [scale, scale, scale]);
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
        const width = canvas.clientWidth * viewScale;
        const height = canvas.clientHeight * viewScale;
        canvas.width = width;
        canvas.height = height;
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
        canvas.width = width;
        canvas.height = height;
      }
    };

    handleViewScaleChange();
  }, [viewScale]);

  return <canvas ref={canvasRef} style={{ width: '800px', height: '600px' }}></canvas>;
}

export default GLTFRenderer;
