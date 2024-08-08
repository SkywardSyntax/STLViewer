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

function parseSTL(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const isBinary = dataView.getUint32(80, true) > 0;
  if (!isBinary) {
    throw new Error('Only binary STL files are supported.');
  }

  const triangles = dataView.getUint32(80, true);
  const vertices = [];
  const normals = [];

  let offset = 84;
  for (let i = 0; i < triangles; i++) {
    const normal = [
      dataView.getFloat32(offset, true),
      dataView.getFloat32(offset + 4, true),
      dataView.getFloat32(offset + 8, true),
    ];
    normals.push(normal);

    for (let j = 0; j < 3; j++) {
      const vertex = [
        dataView.getFloat32(offset + 12 + j * 12, true),
        dataView.getFloat32(offset + 16 + j * 12, true),
        dataView.getFloat32(offset + 20 + j * 12, true),
      ];
      vertices.push(vertex);
    }

    offset += 50;
  }

  return { vertices, normals };
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

function STLRenderer({ file, onError, zoomLevel, performanceFactor = 0.5, viewScale, onRenderComplete }) {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);

  const memoizedSTLRenderer = useMemo(() => {
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
          const { vertices, normals } = parseSTL(arrayBuffer);

          const vertexBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);

          const normalBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat()), gl.STATIC_DRAW);

          const buffers = {
            position: vertexBuffer,
            normal: normalBuffer,
          };

          const scene = {
            children: [
              {
                buffers,
                vertexCount: vertices.length,
                render: (gl, programInfo, projectionMatrix, modelViewMatrix) => {
                  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
                  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
                  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

                  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
                  gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
                  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

                  gl.useProgram(programInfo.program);
                  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
                  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
                  gl.uniform3fv(programInfo.uniformLocations.lightPosition, [10, 10, 10]);
                  gl.uniform3fv(programInfo.uniformLocations.lightColor, [1, 1, 1]);

                  gl.drawArrays(gl.TRIANGLES, 0, buffers.vertexCount);
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
          console.log('STL file rendered successfully.');
          setIsRenderingComplete(true);
          if (onRenderComplete) {
            onRenderComplete();
          }
        } catch (error) {
          console.error('Error parsing STL file:', error);
          if (onError) {
            onError(error);
          }
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
    memoizedSTLRenderer();
  }, [memoizedSTLRenderer]);

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

export default STLRenderer;
