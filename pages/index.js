import { useState, useEffect } from 'react';
import ToggleSwitch from '../components/ToggleSwitch';
import { StlViewer } from 'react-stl-viewer';
import Button from '../components/Button';

function Home() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);
  const [stlUrl, setStlUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log('File is being processed.');
      setFile(selectedFile);
      setSelectedFile(selectedFile);
      setError(null);
      setIsRenderingComplete(false);
    } else {
      setError('No file selected. Please select an STL file.');
    }
  };

  const handleError = (error) => {
    if (error instanceof RangeError) {
      setError('RangeError: Length out of range of buffer. This error can occur if the STL file is malformed or if there is an issue with the file reading process.');
    } else if (error.message && error.message.startsWith('WebGL Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('Three.js Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('STL Error:')) {
      setError(error.message);
    } else if (error.message && error.message.startsWith('WebGL Context Error:')) {
      setError('WebGL Context Error: There was an issue with the WebGL context. Please try again or use a different browser.');
    } else if (error.message && error.message.startsWith('Buffer Length Error:')) {
      setError('Buffer Length Error: The buffer length is incorrect. This can occur if the STL file is malformed or if there is an issue with the file reading process.');
    } else if (error.message && error.message.startsWith('Malformed STL Error:')) {
      setError('Malformed STL Error: The STL file is malformed. Please check the file and try again.');
    } else if (error.message && error.message.startsWith('Buffer Length Out of Range:')) {
      setError('Buffer Length Out of Range: The buffer length is out of range. This can occur if the STL file is malformed or if there is an issue with the file reading process.');
    } else {
      setError(`An unexpected error occurred: ${error.message || error}`);
    }
  };

  const handleDarkModeToggle = (isOn) => {
    setIsDarkMode(isOn);
    document.body.classList.toggle('dark-mode', isOn);
  };

  const handleRenderComplete = () => {
    setIsRenderingComplete(true);
  };

  const updateCanvasSize = (scale) => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const width = canvas.clientWidth * scale;
      const height = canvas.clientHeight * scale;
      canvas.width = width;
      canvas.height = height;
    }
  };

  useEffect(() => {
    if (file) {
      setIsRenderingComplete(false);
    }
  }, [file]);

  useEffect(() => {
    if (stlUrl) {
      setFile(null);
      setSelectedFile(null);
      setError(null);
      setIsRenderingComplete(false);
    }
  }, [stlUrl]);

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}>
      <main>
        <h1>File Viewer</h1>
        <ToggleSwitch onToggle={handleDarkModeToggle} />
        <input type="file" accept=".stl" onChange={handleFileChange} />
        <Button isSelected={selectedFile !== null} onClick={() => document.querySelector('input[type="file"]').click()}>
          {selectedFile ? 'Change File' : 'Select File'}
        </Button>
        <label htmlFor="stlUrl">STL File URL</label>
        <input type="text" id="stlUrl" value={stlUrl} onChange={(e) => setStlUrl(e.target.value)} />
        {error && <p className="error">{error}</p>}
        {file ? (
          <>
            <StlViewer
              url={URL.createObjectURL(file)}
              cameraProps={{ distance: 50, latitude: Math.PI / 6, longitude: Math.PI / 4 }}
              style={{ width: '400px', height: '300px' }}
              onError={handleError}
              onFinishLoading={handleRenderComplete}
            />
            <p>{isRenderingComplete ? 'File rendering complete.' : 'File is being rendered.'}</p>
          </>
        ) : stlUrl ? (
          <>
            <StlViewer
              url={stlUrl}
              cameraProps={{ distance: 50, latitude: Math.PI / 6, longitude: Math.PI / 4 }}
              style={{ width: '400px', height: '300px' }}
              onError={handleError}
              onFinishLoading={handleRenderComplete}
            />
            <p>{isRenderingComplete ? 'File rendering complete.' : 'File is being rendered.'}</p>
          </>
        ) : (
          <p>No file selected.</p>
        )}
      </main>
    </div>
  );
}

export default Home;
