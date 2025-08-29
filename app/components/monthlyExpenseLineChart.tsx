import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface MonthlyExpenseLineChartProps {
  monthAgg: [string, number][];
  currency?: string;
  onClose?: () => void;
}

interface Point { x:number; y:number; label:string; value:number }

export const MonthlyExpenseLineChart: React.FC<MonthlyExpenseLineChartProps> = ({ monthAgg, currency='₹', onClose }) => {
  const dims = useWindowDimensions();
  const [tooltip, setTooltip] = useState<null | { x:number; y:number; label:string; value:number; max:number }>(null);

  const buildLinePath = useCallback((width: number, height: number) => {
    if (monthAgg.length === 0) return null;
    const maxVal = Math.max(...monthAgg.map(([,v])=>v));
    const stepX = width / Math.max(1, monthAgg.length - 1);
    const pts: Point[] = monthAgg.map(([key,v], i)=> ({ x: i*stepX, y: height - (v/maxVal)*height, label: key, value: v }));
    const p = Skia.Path.Make();
    p.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) {
      const prev = pts[i-1];
      const curr = pts[i];
      const cx = (prev.x + curr.x)/2;
      p.quadTo(prev.x, prev.y, cx, (prev.y+curr.y)/2);
    }
    p.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
    return { path: p, pts, maxVal };
  }, [monthAgg]);

  // Fullscreen path (compute regardless, lightweight when not used)
  const headerHeight = 48;
  const verticalPadding = 40;
  const fsLineWidth = dims.width;
  const fsLineHeight = dims.height - headerHeight - verticalPadding;
  const fsPadLeft = 56; const fsPadRight = 36; const fsPadBottom = 44; const fsPadTop = 8;
  const innerLineWidth = fsLineWidth - fsPadLeft - fsPadRight;
  const innerLineHeight = fsLineHeight - fsPadBottom - fsPadTop;
  const fullscreenLinePath = useMemo(()=> {
    const base = buildLinePath(innerLineWidth, innerLineHeight);
    if (!base) return null;
    const pts = base.pts.map(pt=> ({ ...pt, x: pt.x + fsPadLeft, y: pt.y + fsPadTop }));
    const shifted = Skia.Path.Make();
    shifted.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) {
      const prev = pts[i-1];
      const curr = pts[i];
      const cx = (prev.x + curr.x)/2;
      shifted.quadTo(prev.x, prev.y, cx, (prev.y+curr.y)/2);
    }
    shifted.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
    return { path: shifted, pts, maxVal: base.maxVal };
  }, [buildLinePath, innerLineWidth, innerLineHeight, fsPadLeft, fsPadTop]);

  // Manual animation for draw reveal
  const [animProgress, setAnimProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [pointsAnimProgress, setPointsAnimProgress] = useState( 0 );
  const ptsRafRef = useRef<number | null>(null);
  const [glowVal, setGlowVal] = useState(0); // 0..1 pulse for active point
  const glowRafRef = useRef<number | null>(null);
  useEffect(()=> {
    if (!fullscreenLinePath) return;
    setAnimProgress(0); setPointsAnimProgress(0);
    const duration = 900;
    const easeInOutCubic = (t:number)=> t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start == null) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(1, elapsed / duration);
      setAnimProgress(easeInOutCubic(raw));
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return ()=> { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [fullscreenLinePath]);

  // Kick off point pop-in after line finishes (or near end)
  useEffect(()=> {
    if (!fullscreenLinePath) return;
    if (animProgress < 1) return; // wait for line complete
    setPointsAnimProgress(0);
    const duration = 600; // total span for stagger
    const easeOutBack = (t:number)=> {
      const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t-1,3) + c1 * Math.pow(t-1,2);
    };
    let start: number | null = null;
    const step = (ts:number) => {
      if (start == null) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(1, elapsed / duration);
      setPointsAnimProgress(easeOutBack(raw));
      if (raw < 1) ptsRafRef.current = requestAnimationFrame(step);
    };
    ptsRafRef.current = requestAnimationFrame(step);
    return ()=> { if (ptsRafRef.current) cancelAnimationFrame(ptsRafRef.current); };
  }, [fullscreenLinePath, animProgress]);

  // Glow pulse animation for active point
  useEffect(()=> {
    // Glow pulse when a tooltip (active point) is present
    if (!tooltip) { setGlowVal(0); if (glowRafRef.current) cancelAnimationFrame(glowRafRef.current); return; }
    let start: number | null = null;
    const loop = (ts:number) => {
      if (start == null) start = ts;
      const elapsed = (ts - start) / 1000; // seconds
      const speed = 1.2; // pulses per second
      const phase = (Math.sin(elapsed * speed * Math.PI * 2) + 1)/2; // 0..1
      setGlowVal(phase);
      glowRafRef.current = requestAnimationFrame(loop);
    };
    glowRafRef.current = requestAnimationFrame(loop);
    return ()=> { if (glowRafRef.current) cancelAnimationFrame(glowRafRef.current); };
  }, [tooltip]);

  const handleLineTouch = (e: any) => {
    if (!fullscreenLinePath) return;
    const x = e.nativeEvent.locationX;
    let nearest = fullscreenLinePath.pts[0];
    let minDist = Math.abs(x - nearest.x);
    for (let i=1;i<fullscreenLinePath.pts.length;i++) {
      const d = Math.abs(x - fullscreenLinePath.pts[i].x);
      if (d < minDist) { minDist = d; nearest = fullscreenLinePath.pts[i]; }
    }
    setTooltip({ x: nearest.x, y: nearest.y, label: nearest.label, value: nearest.value, max: fullscreenLinePath.maxVal });
  };

  return (
    <View style={{ flex:1 }}>
      <View style={{ paddingTop: 24, paddingHorizontal:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <Text style={{ color:'#fff', fontSize:20, fontWeight:'700' }}>Monthly Totals</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}><Text style={{ color:'#90CAF9', fontSize:16 }}>Close</Text></TouchableOpacity>
        )}
      </View>
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, marginBottom:4, alignSelf:'flex-start' }}>
          <View style={{ width:14, height:14, backgroundColor:'#42A5F5', borderRadius:3, marginRight:6 }} />
          <Text style={{ color:'#CFD8DC', fontSize:12 }}>Total Expenses (last 12 months)</Text>
        </View>
        <View style={{ width: fsLineWidth, height: fsLineHeight, position:'relative' }}>
          <Canvas style={{ width: fsLineWidth, height: fsLineHeight }}>
            {fullscreenLinePath && (
              <>
                {(() => {
                  const grid = Skia.Path.Make();
                  const yTicks = 4;
                  for (let i=0;i<=yTicks;i++) {
                    const y = fsPadTop + innerLineHeight - (i / yTicks) * innerLineHeight;
                    grid.moveTo(fsPadLeft, y); grid.lineTo(fsLineWidth - fsPadRight, y);
                  }
                  grid.moveTo(fsPadLeft, fsPadTop);
                  grid.lineTo(fsPadLeft, fsPadTop + innerLineHeight);
                  grid.lineTo(fsLineWidth - fsPadRight, fsPadTop + innerLineHeight);
                  return <Path path={grid} color="#263238" style="stroke" strokeWidth={1} />;
                })()}
                <Path path={fullscreenLinePath.path} color="#42A5F5" style="stroke" strokeWidth={4} start={0} end={animProgress} />
                {fullscreenLinePath.pts.map((pt,i)=> {
                  // Stagger logic
                  const perDelay = 40; // ms per point
                  const pointWindow = 260; // active grow window
                  const totalNeeded = (fullscreenLinePath.pts.length-1)*perDelay + pointWindow;
                  const globalMs = pointsAnimProgress * totalNeeded;
                  const startMs = i * perDelay;
                  let local = (globalMs - startMs) / pointWindow;
                  if (local < 0) local = 0; if (local > 1) local = 1;
                  const c1 = 1.70158; const c3 = c1 + 1;
                  const easedRaw = local === 0 ? 0 : 1 + c3 * Math.pow(local-1,3) + c1 * Math.pow(local-1,2);
                  const eased = Math.min(1, Math.max(0, easedRaw));
                  const baseR = 5;
                  const r = baseR * eased;
                  if (r <= 0.1) return null;
                  const isActive = tooltip && tooltip.label===pt.label;
                  const alpha = eased;
                  const inactiveColor = `rgba(100,181,246,${alpha})`;
                  const activeColor = `rgba(255,255,255,${alpha})`;
                  const color = isActive ? activeColor : inactiveColor;
                  const pulseExtra = isActive ? 4 + 4*glowVal : 0;
                  return (
                    <React.Fragment key={i}>
                      {isActive && (
                        <Circle cx={pt.x} cy={pt.y} r={r + pulseExtra + 4} color={`rgba(66,165,245,${0.18 + 0.12*(1-glowVal)})`} />
                      )}
                      <Circle cx={pt.x} cy={pt.y} r={isActive ? r*1.25 : r} color={color} />
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </Canvas>
          <View
            style={{ position:'absolute', left:0, top:0, width: fsLineWidth, height: fsLineHeight }}
            onStartShouldSetResponder={()=>true}
            onMoveShouldSetResponder={()=>true}
            onResponderGrant={handleLineTouch}
            onResponderMove={handleLineTouch}
            onResponderRelease={()=> setTooltip(null)}
            onResponderTerminate={()=> setTooltip(null)}
          />
          {fullscreenLinePath && (
            <View style={{ position:'absolute', left:0, bottom:4, width: fsLineWidth, height:16 }}>
              {fullscreenLinePath.pts.map((pt)=> {
                const month = pt.label.split('-')[1];
                return <Text key={pt.label} style={{ position:'absolute', left: Math.min(Math.max(pt.x-10,fsPadLeft-10), fsLineWidth - fsPadRight - 20), bottom:0, color:'#78909C', fontSize:10 }}>{month}</Text>;
              })}
            </View>
          )}
          {fullscreenLinePath && (
            <View style={{ position:'absolute', left:4, top: fsPadTop, height: innerLineHeight }}>
              {Array.from({length:5}).map((_,i)=>{
                const v = fullscreenLinePath.maxVal * (1 - i/4);
                const y = (innerLineHeight * i)/4 - 6;
                return <Text key={i} style={{ position:'absolute', left:0, top:y, color:'#78909C', fontSize:10 }}>{Math.round(v)}</Text>;
              })}
            </View>
          )}
          {tooltip && (
            <View style={{ position:'absolute', left: Math.min(Math.max(tooltip.x - 60, 4), fsLineWidth - fsPadRight - 120), top: Math.max(tooltip.y - 60, 4), backgroundColor:'#102027', padding:8, borderRadius:8, borderWidth:1, borderColor:'#42A5F5', width:120 }}>
              <Text style={{ color:'#90CAF9', fontSize:11, fontWeight:'600' }}>{tooltip.label}</Text>
              <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>{currency}{tooltip.value.toFixed(2)}</Text>
              <Text style={{ color:'#B0BEC5', fontSize:10 }}>Max {currency}{tooltip.max.toFixed(0)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
