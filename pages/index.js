import { useState, useEffect } from 'react';
import { StlViewer } from 'react-stl-viewer';
import Button from '../components/Button';
import IntroCard from '../components/IntroCard';

function Home() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);
  const [stlUrl, setStlUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log('File is being processed.');
      setFile(selectedFile);
      setSelectedFile(selectedFile);
      setError(null);
      setIsRenderingComplete(false);
      setShowIntroCard(false);
      setIsLoading(true);
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
    setIsLoading(false);
  };

  const handleRenderComplete = () => {
    setIsRenderingComplete(true);
    setIsLoading(false);
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
      setShowIntroCard(false);
      setIsLoading(true);
    }
  }, [stlUrl]);

  useEffect(() => {
    const isFirstLoad = localStorage.getItem('isFirstLoad') === null;
    if (isFirstLoad) {
      setShowIntroCard(true);
      localStorage.setItem('isFirstLoad', 'false');
    } else {
      setShowIntroCard(false);
    }
  }, []);

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}>
      <main>
        {showIntroCard && <IntroCard />}
        <h1>File Viewer</h1>
        <input type="file" accept=".stl" onChange={handleFileChange} className="custom-file-input" id="fileInput" />
        <label htmlFor="fileInput" className="custom-file-label">
          {selectedFile ? 'Change File' : 'Select File'}
        </label>
        <label htmlFor="stlUrl">STL File URL</label>
        <input type="text" id="stlUrl" value={stlUrl} onChange={(e) => setStlUrl(e.target.value)} />
        {error && <p className="error">{error}</p>}
        {isLoading && <div className="loading-spinner"></div>}
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
