import { useEffect, useRef } from 'react';

function STLRenderer({ file, onError }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const arrayBuffer = event.target.result;
        const dataView = new DataView(arrayBuffer);

        // Parse STL file
        const faces = [];
        for (let i = 80; i < dataView.byteLength; i += 50) {
          const normal = [
            dataView.getFloat32(i, true),
            dataView.getFloat32(i + 4, true),
            dataView.getFloat32(i + 8, true),
          ];
          const vertices = [];
          for (let j = 12; j < 48; j += 12) {
            vertices.push([
              dataView.getFloat32(i + j, true),
              dataView.getFloat32(i + j + 4, true),
              dataView.getFloat32(i + j + 8, true),
            ]);
          }
          faces.push({ normal, vertices });
        }

        // Create WebGL buffers
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        const vertices = faces.flatMap(face => face.vertices).flat();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const vertexShaderSource = `
          attribute vec3 position;
          void main() {
            gl_Position = vec4(position, 1.0);
          }
        `;
        const fragmentShaderSource = `
          void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
          }
        `;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        const positionLocation = gl.getAttribLocation(shaderProgram, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
      } catch (error) {
        if (error instanceof RangeError) {
          onError('RangeError: Out of bounds access');
        } else {
          onError('An unexpected error occurred');
        }
      }
    };

    reader.readAsArrayBuffer(file);
  }, [file, onError]);

  return <canvas ref={canvasRef} width="800" height="600"></canvas>;
}

export default STLRenderer;
