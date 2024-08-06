import { useState } from 'react';
import STLRenderer from '../components/STLRenderer';
import { debounce } from 'lodash';

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
    } else {
      setError('An unexpected error occurred');
    }
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
      <input type="number" min="0.00000001" max="100" step="0.00000001" value={zoomLevel} onChange={handleZoomChange} />
      {error && <p className="error">{error}</p>}
      {file && <STLRenderer file={file} onError={handleError} zoomLevel={zoomLevel} />}
    </main>
  );
}

export default Home;
