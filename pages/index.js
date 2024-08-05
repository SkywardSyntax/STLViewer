import { useState } from 'react';
import STLRenderer from '../components/STLRenderer';

function Home() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const handleError = (error) => {
    if (error instanceof RangeError) {
      setError('RangeError: Out of bounds access');
    } else {
      setError('An unexpected error occurred');
    }
  };

  return (
    <main>
      <h1>STL File Viewer</h1>
      <input type="file" accept=".stl" onChange={handleFileChange} />
      {error && <p className="error">{error}</p>}
      {file && <STLRenderer file={file} onError={handleError} />}
    </main>
  );
}

export default Home;
