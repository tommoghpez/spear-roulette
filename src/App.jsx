import React, { useMemo, useRef, useState } from "react";

export default function SpearRouletteApp() {
  const segments = [
    { label: "ソウメイ", weight: 30 },
    { label: "真奈美",   weight: 15 },
    { label: "MIKI",    weight: 20 },
    { label: "さと",    weight: 10 },
    { label: "YUTAKA",  weight: 15 },
    { label: "永井",    weight: 5  },
    { label: "ご指名",  weight: 5  },
  ];
  const total = segments.reduce((a,b)=>a+b.weight,0);
  const [rotation,setRotation] = useState(0);
  const [spinning,setSpinning] = useState(false);
  const [resultIdx,setResultIdx] = useState(null);
  const [message,setMessage] = useState("");
  const arcs = useMemo(()=>buildArcs(segments),[segments]);

  function start(){
    if (spinning) return;
    setSpinning(true); setResultIdx(null); setMessage("");

    // 重み付き抽選
    const r = Math.random()*total; let acc=0, idx=0;
    for (let i=0;i<segments.length;i++){ acc+=segments[i].weight; if (r<=acc){ idx=i; break; } }

    // 針（上側）に当たるように回転角を決める
    const targetMid = arcs[idx].midAngle;
    const base = rotation % 360;
    const extraSpins = 720 + 360 * Math.floor(Math.random()*2); // 2〜3回転
    const jitter = (Math.random()-0.5)*2; // 微調整
    const targetRotation = base + extraSpins - targetMid + jitter;
    requestAnimationFrame(()=>setRotation(targetRotation));

    const durationMs = 3500;
    setTimeout(()=>{
      setSpinning(false); setResultIdx(idx);
      const winner = segments[idx].label;
      if (winner==="ご指名"){
        const others = segments.filter(s=>s.label!=="ご指名").map(s=>s.label);
        const chosen = others[Math.floor(Math.random()*others.length)];
        setMessage(`（${chosen}）さん、誰かをご指名下さい！`);
      } else {
        setMessage(`${winner} さんの当選です！`);
      }
    }, durationMs+60);
  }

  return (
    <div style={page}>
      <h1 style={title}>Spear Roulette</h1>

      <div style={{position:'relative'}}>
        {/* 針 */}
        <div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',zIndex:20}}>
          <Pointer/>
        </div>

        {/* ルーレット本体 */}
        <div style={wheelBox}>
          <svg viewBox="0 0 400 400" style={{
            width:340,height:340,userSelect:'none',
            transform:`rotate(${rotation}deg)`,
            transition:spinning?"transform 3.5s cubic-bezier(0.12,0.11,0,1)":"none",
          }}>
            <g transform="rotate(-90 200 200)">
              {arcs.map((a,i)=>(
                <g key={i}>
                  <path d={a.path} fill={wheelColor(i)} stroke="#e2e8f0" strokeWidth="1"/>
                  <text x={a.labelX} y={a.labelY} textAnchor="middle" dominantBaseline="middle"
                        fontSize="14" fill="#0f172a"
                        transform={`rotate(${a.midForText} ${a.labelX} ${a.labelY})`}>
                    {segments[i].label}
                  </text>
                </g>
              ))}
              <circle cx="200" cy="200" r="24" fill="#ffffff" stroke="#e2e8f0"/>
            </g>
          </svg>
        </div>
      </div>

      <button onClick={start} disabled={spinning} style={spinning?btnDisabled:btn}>
        {spinning ? "回転中…" : "スタート"}
      </button>

      <div style={{height:40,marginTop:16,fontSize:18}}>
        {resultIdx!=null && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            <div style={{fontSize:28}}>🎉🎊</div>
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 見た目 ---------- */
const page  ={minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f8fafc',color:'#0f172a',padding:'24px'};
const title ={fontSize:24,fontWeight:700,marginBottom:16};
const wheelBox={width:360,height:360,borderRadius:'9999px',background:'#fff',border:'1px solid #e2e8f0',display:'grid',placeItems:'center',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'};
const btn   ={marginTop:24,borderRadius:16,background:'#0ea5e9',color:'#fff',padding:'12px 24px',fontSize:18,fontWeight:700,border:'none',boxShadow:'0 2px 6px rgba(0,0,0,0.1)',cursor:'pointer'};
const btnDisabled={...btn,background:'#cbd5e1',cursor:'default'};

/* ---------- パーツ ---------- */
function Pointer(){
  return (
    <svg width="24" height="28" viewBox="0 0 24 28" style={{filter:'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'}}>
      <path d="M12 0 L24 24 L0 24 Z" fill="#ef4444"/>
      <rect x="9" y="24" width="6" height="4" rx="1" fill="#ef4444"/>
    </svg>
  );
}

/* ---------- 幾何計算 ---------- */
function wheelColor(i){const c=["#fef3c7","#e0f2fe","#dcfce7","#fae8ff","#ffe4e6","#ede9fe","#e2e8f0"];return c[i%c.length];}
function buildArcs(segments){
  const total=segments.reduce((a,b)=>a+b.weight,0);
  let start=0; const cx=200,cy=200,r=160;
  return segments.map(seg=>{
    const sweep=(seg.weight/total)*360; const end=start+sweep;
    const path=sectorPath(cx,cy,r,start,end);
    const midAngle=start+sweep/2; const labelR=r*0.62;
    const {x,y}=polar(cx,cy,labelR,degToRad(midAngle));
    const midForText=midAngle+90;
    const arc={path,startAngle:start,endAngle:end,midAngle,labelX:x,labelY:y,midForText};
    start=end; return arc;
  });
}
function sectorPath(cx,cy,r,startDeg,endDeg){
  const start=polar(cx,cy,r,degToRad(startDeg));
  const end=polar(cx,cy,r,degToRad(endDeg));
  const largeArc=endDeg-startDeg<=180?0:1;
  return [`M ${cx} ${cy}`,`L ${start.x} ${start.y}`,`A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,"Z"].join(" ");
}
function polar(cx,cy,r,theta){const x=cx+r*Math.sin(theta);const y=cy-r*Math.cos(theta);return {x,y};}
const degToRad = d => (d*Math.PI)/180;
