import React, { useState } from "react";
import Wheel from "./components/Wheel.jsx";

const createId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now();
};

const createDefaultWheel = (idx = 1) => ({
  id: createId(),
  name: `돌림판 ${idx}`,
  options: [
    { id: createId(), label: "옵션 1", probability: 50 },
    { id: createId(), label: "옵션 2", probability: 50 }
  ]
});

export default function App() {
  const [wheels, setWheels] = useState([createDefaultWheel(1)]);

  const addWheel = () => {
    setWheels((prev) => [...prev, createDefaultWheel(prev.length + 1)]);
  };

  const updateWheel = (id, updater) => {
    setWheels((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updater(w) } : w))
    );
  };

  const removeWheel = (id) => {
    setWheels((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>커스텀 돌림판</h1>
        <p className="subtitle">
          여러 개의 돌림판을 만들고, 각 옵션 이름과 확률(%)을 자유롭게 설정해보세요.
        </p>
        <button className="primary-btn" onClick={addWheel}>
          + 새 돌림판 추가
        </button>
      </header>

      <div className="wheel-grid">
        {wheels.map((wheel, idx) => (
          <Wheel
            key={wheel.id}
            wheel={wheel}
            index={idx + 1}
            onChange={(updater) => updateWheel(wheel.id, updater)}
            onRemove={() => removeWheel(wheel.id)}
          />
        ))}

        {wheels.length === 0 && (
          <div className="empty">
            돌림판이 없습니다. 상단의 “새 돌림판 추가” 버튼을 눌러주세요.
          </div>
        )}
      </div>
    </div>
  );
}
