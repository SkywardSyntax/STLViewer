import { useState, useEffect } from 'react';
import styles from './IntroCard.module.css';

export default function IntroCard() {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    const isFirstLoad = localStorage.getItem('isFirstLoad') === null;
    if (isFirstLoad) {
      setIsVisible(true);
      localStorage.setItem('isFirstLoad', 'false');
    } else {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.card}>
      <h2>Welcome to the STL Viewer</h2>
      <p>This project allows you to upload and view STL files.</p>
      <p>To get started, select an STL file using the button above.</p>
      <p>Once the STL is rendered, you can switch views and interact with the model.</p>
      <button onClick={handleClose} className={styles.closeButton}>Close</button>
    </div>
  );
}
