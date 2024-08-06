import { useState } from 'react';
import STLRenderer from '../components/STLRenderer';

function Home() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const handleError = (error) => {
    if (error instanceof RangeError) {
      setError('RangeError: Out of bounds access');
    } else if (error.message && error.message.startsWith('WebGL Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('Three.js Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('ASCII STL Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('STL Error:')) {
      setError(error.message);
    } else {
      setError(`An unexpected error occurred: ${error.message || error}`);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const debouncedZoomChange = debounce((value) => {
    setZoomLevel(value);
  }, 100);

  const handleZoomChange = (event) => {
    debouncedZoomChange(event.target.value);
  };

  return (
    <main>
      <h1>STL File Viewer</h1>
      <input type="file" accept=".stl" onChange={handleFileChange} />
      <input type="range" min="0.00000001" max="100" step="0.00000001" value={zoomLevel} onChange={handleZoomChange} />
      {error && <p className="error">{error}</p>}
      {file && <STLRenderer file={file} onError={handleError} zoomLevel={zoomLevel} />}
    </main>
  );
}

export default Home;
