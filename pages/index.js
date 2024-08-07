import { useState } from 'react';
import STLRenderer from '../components/STLRenderer';
import ToggleSwitch from '../components/ToggleSwitch';

function Home() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [performanceFactor, setPerformanceFactor] = useState(0.5);
  const [viewScale, setViewScale] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log('STL file is being processed.');
      setFile(selectedFile);
      setError(null);
    } else {
      setError('No file selected. Please select an STL file.');
    }
  };

  const handleError = (error) => {
    if (error instanceof RangeError) {
      setError('RangeError: Out of bounds access. This error can occur if the STL file is malformed or if there is an issue with the file reading process.');
    } else if (error.message && error.message.startsWith('WebGL Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('Three.js Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('STL Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('WebGL Context Error:')) {
      setError('WebGL Context Error: There was an issue with the WebGL context. Please try again or use a different browser.');
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
    setZoomLevel(event.target.value);
  };

  const handleViewScaleChange = (event) => {
    setViewScale(event.target.value);
  };

  const handlePerformanceFactorChange = (event) => {
    setPerformanceFactor(event.target.value);
  };

  const handleDarkModeToggle = (isOn) => {
    setIsDarkMode(isOn);
    document.body.classList.toggle('dark-mode', isOn);
  };

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}>
      <main>
        <h1>STL File Viewer</h1>
        <ToggleSwitch onToggle={handleDarkModeToggle} />
        <input type="file" accept=".stl" onChange={handleFileChange} />
        <label htmlFor="zoomLevel">Zoom Level</label>
        <input type="range" id="zoomLevel" min="-100" max="100" step="1" value={zoomLevel} onChange={handleZoomChange} />
        <label htmlFor="viewScale">View Scale</label>
        <input type="range" id="viewScale" min="0.1" max="2" step="0.1" value={viewScale} onChange={handleViewScaleChange} />
        <label htmlFor="performanceFactor">Performance Factor</label>
        <input type="range" id="performanceFactor" min="0.1" max="1" step="0.1" value={performanceFactor} onChange={handlePerformanceFactorChange} />
        {error && <p className="error">{error}</p>}
        {file ? (
          <>
            <STLRenderer file={file} onError={handleError} zoomLevel={zoomLevel} performanceFactor={performanceFactor} viewScale={viewScale} />
            <p>STL file is being rendered.</p>
          </>
        ) : (
          <p>No STL file selected.</p>
        )}
      </main>
    </div>
  );
}

export default Home;
