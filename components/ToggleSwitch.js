import { useState } from 'react';

export default function ToggleSwitch({ onToggle }) {
  const [isOn, setIsOn] = useState(false);

  const handleToggle = () => {
    setIsOn(!isOn);
    onToggle(!isOn);
  };

  return (
    <div className="toggle-switch" onClick={handleToggle}>
      <div className={`toggle-knob ${isOn ? 'on' : 'off'}`}></div>
    </div>
  );
}
