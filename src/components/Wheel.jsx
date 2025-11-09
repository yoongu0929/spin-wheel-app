import React, { useState } from "react";

const COLORS = [
  "#7dd3fc",
  "#fda4af",
  "#bbf7d0",
  "#fde68a",
  "#a5b4fc",
  "#fed7e2",
  "#6ee7b7",
  "#fca5a5"
];

const createId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now();
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z"
  ].join(" ");
}

export default function Wheel({ wheel, index, onChange, onRemove }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);

  // 확률 합 (입력값이 그대로 % 의미. 합이 100이 아니면 비율 기준으로 처리)
  const totalProbability = wheel.options.reduce((sum, o) => {
    const p = Number(o.probability);
    return sum + (p > 0 ? p : 0);
  }, 0);

  const handleNameChange = (e) => {
    const name = e.target.value;
    onChange(() => ({ name }));
  };

  const handleOptionChange = (id, field, value) => {
    onChange((current) => ({
      options: current.options.map((opt) =>
        opt.id === id
          ? {
              ...opt,
              [field]:
                field === "probability"
                  ? Number(value) >= 0
                    ? Number(value)
                    : 0
                  : value
            }
          : opt
      )
    }));
  };

  const addOption = () => {
    onChange((current) => ({
      options: [
        ...current.options,
        {
          id: createId(),
          label: `옵션 ${current.options.length + 1}`,
          probability: 0
        }
      ]
    }));
  };

  const removeOption = (id) => {
    onChange((current) => ({
      options: current.options.filter((o) => o.id !== id)
    }));
  };

  const spin = () => {
    if (isSpinning) return;
    if (!wheel.options.length || totalProbability <= 0) {
      alert("옵션과 확률(%)을 먼저 설정해주세요.");
      return;
    }

    // 확률(%) 기반 랜덤 선택
    const r = Math.random() * totalProbability;
    let acc = 0;
    let chosen = wheel.options[0];

    for (const opt of wheel.options) {
      const p = Math.max(0, Number(opt.probability) || 0);
      acc += p;
      if (r <= acc) {
        chosen = opt;
        break;
      }
    }

    // 각 옵션의 각도 범위를 계산해서, 포인터(위쪽)에 선택된 옵션이 오도록 회전값 계산
    let startAngle = 0;
    let chosenCenter = 0;

    wheel.options.forEach((opt) => {
      const p = Math.max(0, Number(opt.probability) || 0);
      const angle = (p / totalProbability) * 360;
      const endAngle = startAngle + angle;
      if (opt.id === chosen.id) {
        chosenCenter = startAngle + angle / 2;
      }
      startAngle = endAngle;
    });

    const extraSpins = 4;
    const targetRotation =
      rotation + extraSpins * 360 + (90 - chosenCenter);

    setIsSpinning(true);
    setResult(null);
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(chosen.label || "(이름 없는 옵션)");
    }, 2600);
  };

  // SVG 데이터
  const size = 260;
  const radius = size / 2 - 4;
  const center = size / 2;

  let currentAngle = 0;
  const slices = wheel.options.map((opt, i) => {
    const p = Math.max(0, Number(opt.probability) || 0);
    const angle =
      totalProbability > 0 ? (p / totalProbability) * 360 : 0.0001;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;

    const path = describeArc(center, center, radius, start, end);
    const color = COLORS[i % COLORS.length];
    const mid = start + angle / 2;
    const labelPos = polarToCartesian(
      center,
      center,
      radius * 0.6,
      mid
    );

    // 실제 비율 (정규화된 확률)
    const normalized =
      totalProbability > 0
        ? ((p / totalProbability) * 100).toFixed(1)
        : 0;

    return {
      id: opt.id,
      path,
      color,
      label: opt.label || "",
      displayProb: isFinite(normalized) ? normalized : 0,
      labelPos
    };
  });

  return (
    <div className="wheel-card">
      <div className="wheel-header">
        <input
          className="wheel-title-input"
          value={wheel.name}
          onChange={handleNameChange}
          placeholder={`돌림판 ${index}`}
        />
        <div className="wheel-header-actions">
          <button className="ghost-btn" onClick={addOption}>
            + 옵션 추가
          </button>
          <button className="danger-btn" onClick={onRemove}>
            삭제
          </button>
        </div>
      </div>

      <div className="wheel-layout">
        <div className="wheel-wrapper">
          {/* 포인터 */}
          <div className="pointer" />

          {/* SVG Wheel */}
          <svg
            className="wheel-svg"
            width={size}
            height={size}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? "transform 2.5s cubic-bezier(0.22, 0.61, 0.36, 1)"
                : "none"
            }}
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="#111827"
              stroke="#4b5563"
              strokeWidth="3"
            />
            {slices.map((s) => (
              <g key={s.id}>
                <path
                  d={s.path}
                  fill={s.color}
                  stroke="#111827"
                  strokeWidth="1"
                />
                {s.label && (
                  <text
                    x={s.labelPos.x}
                    y={s.labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fill="#111827"
                    style={{ pointerEvents: "none" }}
                  >
                    {s.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div className="options-panel">
          <div className="options-header">
            <span>이름</span>
            <span>확률(%)</span>
            <span></span>
          </div>

          {wheel.options.map((opt) => (
            <div className="option-row" key={opt.id}>
              <input
                className="option-input"
                value={opt.label}
                onChange={(e) =>
                  handleOptionChange(opt.id, "label", e.target.value)
                }
                placeholder="옵션 이름"
              />
              <input
                className="option-input probability"
                type="number"
                min="0"
                value={opt.probability}
                onChange={(e) =>
                  handleOptionChange(
                    opt.id,
                    "probability",
                    e.target.value
                  )
                }
              />
              <button
                className="icon-btn"
                onClick={() => removeOption(opt.id)}
                title="삭제"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="total-info">
            입력 합계: <strong>{totalProbability}</strong>%{" "}
            {totalProbability !== 100 &&
              " (합이 100이 아니면 비율 기준으로 자동 계산됩니다.)"}
          </div>

          <button
            className="spin-btn"
            onClick={spin}
            disabled={isSpinning}
          >
            {isSpinning ? "도는 중..." : "돌리기"}
          </button>

          {result && (
            <div className="result-label">
              결과: <strong>{result}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
