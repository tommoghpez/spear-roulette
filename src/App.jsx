import React, { useMemo, useState } from "react";

/** ====== 設定（名前と重み％） ====== */
const SEGMENTS = [
  { label: "ソウメイ", weight: 30 },
  { label: "真奈美",   weight: 15 },
  { label: "MIKI",    weight: 20 },
  { label: "さと",    weight: 10 },
  { label: "YUTAKA",  weight: 15 },
  { label: "永井",    weight: 5  },
  { label: "ご指名",  weight: 5  }
];

export default function App() {
  const total = SEGMENTS.reduce((a, b) => a + b.weight, 0);
  const arcs   = useMemo(() => buildArcs(SEGMENTS), []);
  const [spinning, setSpinning]   = useState(false);
  const [rotation, setRotation]   = useState(0);
  const [resultIdx, setResultIdx] = useState(null);
  const [message,   setMessage]   = useState("");

// --- 追加（モバイル最適化）---
const isMobile =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 480px)").matches;

const wheelSize = isMobile ? 300 : 340; // スマホは少し小さくして全体を上に

  function startSpin() {
    if (spinning) return;

    setSpinning(true);
    setResultIdx(null);
    setMessage("");

    // --- 重み付き抽選 ---
    const r = Math.random() * total;
    let acc = 0, idx = 0;
    for (let i = 0; i < SEGMENTS.length; i++) {
      acc += SEGMENTS[i].weight;
      if (r <= acc) { idx = i; break; }
    }

    // --- 真上で止まるように回転角を“スナップ”させる ---
    const base  = ((rotation % 360) + 360) % 360;     // 現在角（0..359）
    const extra = 720 + Math.floor(Math.random() * 360); // 2回転 + α（見た目用）
    // (base + extra + snapDelta + midAngle) % 360 === 0 になるように調整
    const snapDelta = (360 - ((base + extra + arcs[idx].midAngle) % 360)) % 360;
    const target = base + extra + snapDelta;

    setRotation(target);

    // --- 停止後の処理 ---
    const DURATION = 3500;
    setTimeout(() => {
      setSpinning(false);
      setResultIdx(idx);

      const winner = SEGMENTS[idx].label;
      if (winner === "ご指名") {
        const others = SEGMENTS.filter(s => s.label !== "ご指名").map(s => s.label);
        const chosen = others[Math.floor(Math.random() * others.length)];
        setMessage(`（${chosen}）さん、誰かをご指名下さい！`);
      } else {
        setMessage(`${winner} さんの当選です！`);
      }
    }, DURATION + 80);
  }

  return (
    <div style={{ ...page, justifyContent: isMobile ? "flex-start" : "center", paddingTop: isMobile ? 8 : 16 }}>
      <h1 style={title}>Spia Roulette</h1>

      {/* 上の固定針（ここに止まった人が当たり） */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ textAlign: "center", fontSize: 12, color: "#475569" }}>
          ⇧ ここに止まった名前が <b>当たり</b>
        </div>
        <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <Pointer />
        </div>

        {/* ルーレット本体（円盤だけが回る） */}
        <div style={{ ...wheelBox, width: wheelSize, height: wheelSize, position: "relative" }}>
          <svg
            viewBox="0 0 400 400"
            style={{
  width: wheelSize - 20,
  height: wheelSize - 20,
  transform: `rotate(${rotation}deg)`,
  transition: spinning ? "transform 3.5s cubic-bezier(0.12,0.11,0,1)" : "none",
}}
          >
            <g>
              {arcs.map((a, i) => (
                <g key={i}>
                  <path d={a.path} fill={sliceColor(i)} stroke="#e2e8f0" />
                  <text
                    x={a.labelX} y={a.labelY}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="14" fill="#0f172a"
                    transform={`rotate(${a.textAngle} ${a.labelX} ${a.labelY})`}
                  >
                    {SEGMENTS[i].label}
                  </text>
                </g>
              ))}
              <circle cx="200" cy="200" r="22" fill="#fff" stroke="#e2e8f0" />
            </g>
          </svg>

          {/* ★固定センターライン（SVGの外側に置くので回らない） */}
          <div style={centerLine} />
        </div>
      </div>

      <button onClick={startSpin} disabled={spinning} style={spinning ? btnDisabled : btn}>
        {spinning ? "回転中…" : "スタート"}
      </button>

      <div style={{ height: isMobile ? 40 : 56, marginTop: isMobile ? 8 : 16, fontSize: 18, textAlign: "center" }}>
        {resultIdx !== null && (
          <div>
            <div style={{ fontSize: 26, marginBottom: 4 }}>🎉</div>
            <div>{message}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====== スタイル ====== */
const page  = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8fafc",
  color: "#0f172a",
  padding: 16,
};
const title = { fontSize: 22, fontWeight: 700, marginBottom: 12 };

// wheelBox は relative にして、上に centerLine を重ねられるようにする
const wheelBox = {
  width: 340, height: 340,
  borderRadius: "9999px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  display: "grid", placeItems: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  position: "relative",
};

// 真上の固定センターライン（SVGの外）
const centerLine = {
  position: "absolute",
  top: 20,                 // 微調整（円の内側に入るくらい）
  left: "50%",
  transform: "translateX(-50%)",
  width: 2,
  height: 140,            // 長さはお好みで
  background: "#ef4444",
  borderRadius: 1,
  pointerEvents: "none",
};

const btn = {
  marginTop: 8,
  borderRadius: 14,
  background: "#0ea5e9",
  color: "#fff",
  padding: "12px 24px",
  fontSize: 18,
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};
const btnDisabled = { ...btn, background: "#94a3b8", cursor: "default" };

/* ====== パーツ：針（タイトル下の赤い三角） ====== */
function Pointer() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.2))" }}>
      <path d="M12 0 L24 22 L0 22 Z" fill="#ef4444" />
      <rect x="9" y="22" width="6" height="4" rx="1" fill="#ef4444" />
    </svg>
  );
}

/* ====== 円弧のジオメトリ ====== */
function sliceColor(i) {
  // くっきり認識できる彩度高めのパレット
  const colors = [
    "#f87171", // red-400
    "#60a5fa", // sky-400
    "#34d399", // emerald-400
    "#f472b6", // pink-400
    "#f59e0b", // amber-500
    "#94a3b8", // slate-400
    "#818cf8", // indigo-400
  ];
  return colors[i % colors.length];
}

// 0度＝真上／時計回り の極座標で円弧を作成
function buildArcs(items) {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let start = 0;
  const cx = 200, cy = 200, r = 160;

  return items.map(it => {
    const sweep = (it.weight / total) * 360;
    const end   = start + sweep;
    const path  = sectorPath(cx, cy, r, start, end);
    const mid   = start + sweep / 2;

    const labelR = r * 0.62;
    const { x, y } = polar(cx, cy, labelR, degToRad(mid));
    const textAngle = mid + 90; // ラベルを読みやすく

    const a = { path, startAngle: start, endAngle: end, midAngle: mid, labelX: x, labelY: y, textAngle };
    start = end;
    return a;
  });
}

function sectorPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, degToRad(startDeg));
  const e = polar(cx, cy, r, degToRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

// 0度＝真上／時計回りでの極座標
function polar(cx, cy, r, t) { return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t) }; }
const degToRad = d => (d * Math.PI) / 180;