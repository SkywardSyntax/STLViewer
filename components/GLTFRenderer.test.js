import { render, screen } from '@testing-library/react';
import GLTFRenderer from './GLTFRenderer';

describe('GLTFRenderer', () => {
  test('renders without crashing', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 6 }
      ],
      buffers: [{ byteLength: 42, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    render(<GLTFRenderer file={file} onError={console.error} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  test('handles RangeError gracefully', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 6 }
      ],
      buffers: [{ byteLength: 30, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    const onError = jest.fn();
    render(<GLTFRenderer file={file} onError={onError} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    expect(onError).toHaveBeenCalledWith(expect.any(RangeError));
  });

  test('handles jsonChunkLength out of range', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 6 }
      ],
      buffers: [{ byteLength: 20, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    const onError = jest.fn();
    render(<GLTFRenderer file={file} onError={onError} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    expect(onError).toHaveBeenCalledWith(expect.any(RangeError));
  });

  test('handles buffer length out of range', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 6 }
      ],
      buffers: [{ byteLength: 10, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    const onError = jest.fn();
    render(<GLTFRenderer file={file} onError={onError} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    expect(onError).toHaveBeenCalledWith(expect.any(RangeError));
  });

  test('handles detailed error messages', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 6 }
      ],
      buffers: [{ byteLength: 10, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    const onError = jest.fn();
    render(<GLTFRenderer file={file} onError={onError} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Length out of range of buffer. This error can occur if the glTF file is malformed or if there is an issue with the file reading process.')
    }));
  });

  test('handles missing optional attributes gracefully', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: {},
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 6 }
      ],
      buffers: [{ byteLength: 6, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    render(<GLTFRenderer file={file} onError={console.error} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  test('handles missing buffer views gracefully', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
      ],
      buffers: [{ byteLength: 42, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    const onError = jest.fn();
    render(<GLTFRenderer file={file} onError={onError} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  test('handles missing accessors gracefully', () => {
    const file = new Blob([JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          indices: 1
        }]
      }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 6 }
      ],
      buffers: [{ byteLength: 42, uri: 'data:application/octet-stream;base64,AAAAAA==' }]
    })], { type: 'application/json' });

    const onError = jest.fn();
    render(<GLTFRenderer file={file} onError={onError} zoomLevel={0} performanceFactor={0.5} viewScale={1} onRenderComplete={console.log} />);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
