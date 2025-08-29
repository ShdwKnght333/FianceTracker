import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface ExpenseDonutChartProps {
  typeAgg: [string, number][];
  colors?: string[];
  currency?: string;
  onClose?: () => void;
}

interface DonutSeg { label:string; value:number; start:number; end:number }

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({ typeAgg, colors = ['#42A5F5','#66BB6A','#FFA726','#AB47BC','#EC407A','#26C6DA','#FF7043','#9CCC65','#7E57C2','#FFCA28','#26A69A'], currency='₹', onClose }) => {
  const dims = useWindowDimensions();
  const [donutSelected, setDonutSelected] = useState<string | null>(null);
  const [segProgress, setSegProgress] = useState(1); // 0..1 global sequential progress
  const segRafRef = useRef<number | null>(null);
  // Remove previous selection growth/glow animation states
  const centerRafRef = useRef<number | null>(null);
  const [animatedValue, setAnimatedValue] = useState(0);
  const prevValueRef = useRef(0);

  const donutData: DonutSeg[] = useMemo(()=> {
    const total = typeAgg.reduce((s, [,v])=> s+v, 0);
    let start = -Math.PI/2;
    return typeAgg.map(([label, value])=> {
      const angle = (value/Math.max(total,1))*Math.PI*2;
      const seg = { label, value, start, end: start+angle };
      start += angle;
      return seg;
    });
  }, [typeAgg]);
  const donutTotal = useMemo(()=> typeAgg.reduce((s,[,v])=>s+v,0), [typeAgg]);

  // Precompute layout values used by handler (safe even if preview - minimal cost)
  const usableHeight = dims.height - 8; // reduce top/bottom margin
  const donutBoxSize = Math.min(dims.width - 8, usableHeight); // reduce horizontal margin
  const donutPadLeft = 12; const donutPadRight = 12; const donutPadBottom = 18; const donutPadTop = 32;
  const innerWidth = donutBoxSize - (donutPadLeft + donutPadRight);
  const innerHeight = donutBoxSize - (donutPadBottom);

  const handlePoint = useCallback((xOverlay:number, yOverlay:number) => {
    const w = innerWidth; const h = innerHeight;
    const rx = xOverlay - w/2; const ry = yOverlay - h/2;
    const adjRadius = w / 2 * 0.9; const inner = adjRadius * 0.6;
    const dist = Math.sqrt(rx*rx + ry*ry);
    const minHit = inner * 0.55;
    const maxHit = adjRadius + 28;
    if (dist < minHit || dist > maxHit) {
      setDonutSelected(null);
      return;
    }
    let angle = Math.atan2(ry, rx);
    if (angle < -Math.PI/2) angle += Math.PI * 2;
    const seg = donutData.find(s => angle >= s.start && angle < s.end) || donutData[donutData.length-1];
    if (!seg) {
      setDonutSelected(null);
      return;
    }
    setDonutSelected(seg.label);
  }, [donutData, innerWidth, innerHeight]);

  useEffect(()=> {
    if (!donutData.length) return;
    setSegProgress(0);
    const duration = 1100; // ms for full donut
    let start: number | null = null;
    const ease = (t:number)=> t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const step = (ts:number) => {
      if (start==null) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(1, elapsed / duration);
      setSegProgress(ease(raw));
      if (raw < 1) segRafRef.current = requestAnimationFrame(step);
    };
    segRafRef.current = requestAnimationFrame(step);
    return ()=> { if (segRafRef.current) cancelAnimationFrame(segRafRef.current); };
  }, [donutData]);

  // Selection value count-up animation
  useEffect(()=> {
    if (centerRafRef.current) cancelAnimationFrame(centerRafRef.current);
    const targetSeg = donutSelected ? donutData.find(s=>s.label===donutSelected) : null;
    const targetVal = targetSeg ? targetSeg.value : 0;
    const startVal = animatedValue; // continue from current for smooth change
    const diff = targetVal - startVal;
    const duration = 650; // ms
    const easeOutCubic = (t:number)=> 1 - Math.pow(1-t,3);
    if (!targetSeg) {
      // animate back to zero quicker
      const fastDur = 320;
      const stepDown = (ts:number)=> {
        let start: number | null = null;
        if (start==null) start = ts;
        const raw = Math.min(1, (ts-start)/fastDur);
        const eased = easeOutCubic(raw);
        const val = startVal + (0 - startVal)*eased;
        setAnimatedValue(val);
        if (raw < 1) centerRafRef.current = requestAnimationFrame(stepDown);
      };
      if (startVal>0) centerRafRef.current = requestAnimationFrame(stepDown); else { setAnimatedValue(0); }
      return;
    }
    // Animate to new value
    prevValueRef.current = startVal;
    let start: number | null = null;
    const step = (ts:number)=> {
      if (start==null) start = ts;
      const raw = Math.min(1, (ts-start)/duration);
      const eased = easeOutCubic(raw);
      const val = startVal + diff * eased;
      setAnimatedValue(val);
      if (raw < 1) centerRafRef.current = requestAnimationFrame(step);
    };
    centerRafRef.current = requestAnimationFrame(step);
    return ()=> { if (centerRafRef.current) cancelAnimationFrame(centerRafRef.current); };
  }, [donutSelected, donutData, animatedValue]);

  const selectedSegObj = useMemo(()=> donutSelected ? donutData.find(s=>s.label===donutSelected) : null, [donutSelected, donutData]);
  const selectedColor = selectedSegObj ? colors[donutData.findIndex(s=>s.label===selectedSegObj.label) % colors.length] : undefined;

  return (
    <View style={{ flex:1 }}>
      <View style={{ paddingTop: 60, paddingHorizontal:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <Text style={{ color:'#fff', fontSize:20, fontWeight:'700' }}>Expense Type Breakdown</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}><Text style={{ color:'#90CAF9', fontSize:16 }}>Close</Text></TouchableOpacity>
        )}
      </View>
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding: 16, paddingTop:16 }}>
        <View style={{ flexDirection:'row', flexWrap:'wrap', paddingHorizontal:16, gap:16, paddingBottom:48, justifyContent: 'center' }}>
          {donutData.map((seg, idx)=> (
            <TouchableOpacity 
              key={seg.label} 
              style={{ flexDirection:'row', alignItems:'center', marginRight:12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: donutSelected === seg.label ? '#263238' : 'transparent' }}
              onPress={() => setDonutSelected(current => current === seg.label ? null : seg.label)}
            >
              <View style={{ width:12, height:12, backgroundColor:colors[idx % colors.length], borderRadius:3, marginRight:6 }} />
              <Text style={{ color: donutSelected === seg.label ? '#fff' : '#B0BEC5', fontSize:11, fontWeight: donutSelected === seg.label ? 'bold' : 'normal' }}>{seg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: donutBoxSize, height: donutBoxSize, alignItems:'center', justifyContent:'center', paddingLeft:donutPadLeft, paddingRight:donutPadRight, paddingBottom:donutPadBottom, paddingTop:donutPadTop }}>
          <Canvas style={{ width: innerWidth, height: innerHeight }}>
            {donutData.map((seg, idx)=>{
              // Sequential segment reveal (unchanged)
              const fullSpan = seg.end - seg.start;
              const totalCircle = Math.PI * 2;
              const spanFrac = fullSpan / totalCircle;
              let prevSpan = 0; for (let j=0;j<idx;j++) prevSpan += (donutData[j].end - donutData[j].start) / totalCircle;
              const startP = prevSpan; const endP = startP + spanFrac;
              let localRatio: number;
              if (segProgress <= startP) localRatio = 0; else if (segProgress >= endP) localRatio = 1; else localRatio = (segProgress - startP) / spanFrac;
              if (localRatio <= 0) return null;
              const drawnEnd = seg.start + fullSpan * localRatio;
              const center = innerWidth / 2;
              const outerR = innerWidth / 2 * 0.9;
              const innerR = outerR * 0.6;
              // POP OUT selected segment
              const isSelected = donutSelected === seg.label;
              const popDist = isSelected ? 18 : 0;
              const midAngle = (seg.start + seg.end)/2;
              const cx = center + Math.cos(midAngle) * popDist;
              const cy = center + Math.sin(midAngle) * popDist;
              // Fade non-selected segments
              const fill = colors[idx % colors.length];
              const fadedFill = isSelected ? fill : fill + '55';
              // Draw main segment
              const p = Skia.Path.Make();
              p.moveTo(cx + Math.cos(seg.start)*outerR, cy + Math.sin(seg.start)*outerR);
              const sweepOuterDeg = (drawnEnd - seg.start) * 180/Math.PI;
              p.addArc({ x: cx - outerR, y: cy - outerR, width: outerR*2, height: outerR*2 }, seg.start*180/Math.PI, sweepOuterDeg);
              p.lineTo(cx + Math.cos(drawnEnd)*innerR, cy + Math.sin(drawnEnd)*innerR);
              const sweepInnerDeg = -sweepOuterDeg;
              p.addArc({ x: cx - innerR, y: cy - innerR, width: innerR*2, height: innerR*2 }, drawnEnd*180/Math.PI, sweepInnerDeg);
              p.close();
              const nodes: any[] = [];
              nodes.push(<Path key={seg.label} path={p} color={fadedFill} />);
              // THICK ARC highlight for selected
              if (isSelected && localRatio >= 1) {
                const thickArc = Skia.Path.Make();
                thickArc.addArc({ x: cx - outerR - 6, y: cy - outerR - 6, width: (outerR+6)*2, height: (outerR+6)*2 }, seg.start*180/Math.PI, (seg.end-seg.start)*180/Math.PI);
                nodes.push(<Path key={seg.label+':thick'} path={thickArc} color={fill} style="stroke" strokeWidth={12} />);
              }
              return nodes;
            })}
            {(() => {
              const center = innerWidth/2;
              const alpha = Math.min(1, Math.max(0, (segProgress - 0.15)/0.4));
              const innerR = (innerWidth / 2 * 0.9) * 0.6 - 0.5;
              return <Circle cx={center} cy={center} r={innerR} color={`rgba(15,32,39,${alpha})`} />;
            })()}
          </Canvas>
          {selectedSegObj && segProgress >= 1 && (
            <View pointerEvents='none' style={{ position:'absolute', left:0, top:0, width:donutBoxSize, height:donutBoxSize }}>
              <View style={{ position:'absolute', left:0, top:0, width:donutBoxSize, height:donutBoxSize, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color:selectedColor || '#fff', fontSize:32, fontWeight:'800', marginBottom:2 }}>{donutTotal?((selectedSegObj.value/donutTotal*100).toFixed(1)):'0'}%</Text>
                <Text style={{ color:'#CFD8DC', fontSize:15, fontWeight:'600' }}>{selectedSegObj.label}</Text>
                <Text style={{ color:selectedColor || '#fff', fontSize:22, fontWeight:'700', marginTop:2 }}>{currency}{selectedSegObj.value.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          )}
          <View
            style={{ position:'absolute', left:donutPadLeft, top:donutPadTop, width: innerWidth, height: innerHeight }}
            onStartShouldSetResponder={()=>true}
            onMoveShouldSetResponder={()=>true}
            onResponderGrant={(e)=>{ handlePoint(e.nativeEvent.locationX, e.nativeEvent.locationY); }}
            onResponderMove={(e)=>{ handlePoint(e.nativeEvent.locationX, e.nativeEvent.locationY); }}
            onResponderRelease={()=> { /* No action on release */ }}
            onResponderTerminate={()=> { setDonutSelected(null); }}
          />
          <View style={{ position:'absolute', left:donutPadLeft, right:donutPadRight, top:donutPadTop/2 - 32, alignItems:'center' }}>
              <Text style={{ color:'#fff', fontWeight:'600', fontSize:16 }}>Types</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
