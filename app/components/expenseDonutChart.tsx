import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface ExpenseDonutChartProps {
  typeAgg: [string, number][];
  colors?: string[];
  currency?: string;
  onClose?: () => void;
  title?: string;
  legendLabel?: string;
}

interface DonutSeg { label:string; value:number; start:number; end:number }

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({ 
  typeAgg, 
  colors = ['#10B981','#6366F1','#F43F5E','#F59E0B','#8B5CF6','#06B6D4','#EC4899','#84CC16','#64748B','#3B82F6','#14B8A6'], 
  currency='₹', 
  onClose, 
  title, 
  legendLabel 
}) => {
  const dims = useWindowDimensions();
  const [donutSelected, setDonutSelected] = useState<string | null>(null);
  const [segProgress, setSegProgress] = useState(1);
  const segRafRef = useRef<number | null>(null);
  const centerRafRef = useRef<number | null>(null);
  const [animatedValue, setAnimatedValue] = useState(0);

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

  const usableHeight = dims.height - 100;
  const donutBoxSize = Math.min(dims.width - 32, usableHeight);
  const donutPadLeft = 0; const donutPadRight = 0; const donutPadBottom = 0; const donutPadTop = 0;
  const innerWidth = donutBoxSize;
  const innerHeight = donutBoxSize;

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
    const duration = 1200;
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

  useEffect(()=> {
    if (centerRafRef.current) cancelAnimationFrame(centerRafRef.current);
    const targetSeg = donutSelected ? donutData.find(s=>s.label===donutSelected) : null;
    const targetVal = targetSeg ? targetSeg.value : 0;
    const startVal = animatedValue;
    const diff = targetVal - startVal;
    const duration = 650;
    const easeOutCubic = (t:number)=> 1 - Math.pow(1-t,3);
    if (!targetSeg) {
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
  }, [donutSelected, donutData]);

  const selectedSegObj = useMemo(()=> donutSelected ? donutData.find(s=>s.label===donutSelected) : null, [donutSelected, donutData]);
  const selectedColor = selectedSegObj ? colors[donutData.findIndex(s=>s.label===selectedSegObj.label) % colors.length] : undefined;

  return (
    <View style={{ flex:1, backgroundColor: '#020617' }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 24, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <Text style={{ color:'#F8FAFC', fontSize: 24, fontWeight:'800' }}>{title || 'Analysis'}</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12 }}>
            <Text style={{ color:'#64748B', fontSize:14, fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal: 24 }}>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          {donutData.map((seg, idx)=> (
            <TouchableOpacity 
              key={seg.label} 
              style={{ 
                flexDirection:'row', 
                alignItems:'center', 
                paddingVertical: 8, 
                paddingHorizontal: 12, 
                borderRadius: 16, 
                backgroundColor: donutSelected === seg.label ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: donutSelected === seg.label ? colors[idx % colors.length] : 'rgba(255,255,255,0.05)'
              }}
              onPress={() => setDonutSelected(current => current === seg.label ? null : seg.label)}
            >
              <View style={{ width: 10, height: 10, backgroundColor: colors[idx % colors.length], borderRadius: 5, marginRight: 8 }} />
              <Text style={{ color: donutSelected === seg.label ? '#F8FAFC' : '#94A3B8', fontSize: 13, fontWeight: donutSelected === seg.label ? 'bold' : '500' }}>{seg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ width: donutBoxSize, height: donutBoxSize, alignItems:'center', justifyContent:'center' }}>
          <Canvas style={{ width: innerWidth, height: innerHeight }}>
            {donutData.map((seg, idx)=>{
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
              const innerR = outerR * 0.65;
              const isSelected = donutSelected === seg.label;
              const popDist = isSelected ? 12 : 0;
              const midAngle = (seg.start + seg.end)/2;
              const cx = center + Math.cos(midAngle) * popDist;
              const cy = center + Math.sin(midAngle) * popDist;
              const fill = colors[idx % colors.length];
              const fadedFill = isSelected || !donutSelected ? fill : fill + '22';
              
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
              
              if (isSelected && localRatio >= 1) {
                const thickArc = Skia.Path.Make();
                thickArc.addArc({ x: cx - outerR - 4, y: cy - outerR - 4, width: (outerR+4)*2, height: (outerR+4)*2 }, seg.start*180/Math.PI, (seg.end-seg.start)*180/Math.PI);
                nodes.push(<Path key={seg.label+':thick'} path={thickArc} color={fill} style="stroke" strokeWidth={8} />);
              }
              return nodes;
            })}
            {(() => {
              const center = innerWidth/2;
              const alpha = Math.min(1, Math.max(0, (segProgress - 0.15)/0.4));
              const innerR = (innerWidth / 2 * 0.9) * 0.65 - 1;
              return <Circle cx={center} cy={center} r={innerR} color={`rgba(2, 6, 23, ${alpha})`} />;
            })()}
          </Canvas>

          <View pointerEvents='none' style={{ position:'absolute', alignItems:'center', justifyContent:'center' }}>
            {selectedSegObj && segProgress >= 1 ? (
              <>
                <Text style={{ color:'#94A3B8', fontSize: 14, fontWeight:'600', marginBottom: 4 }}>{selectedSegObj.label}</Text>
                <Text style={{ color: selectedColor || '#F8FAFC', fontSize: 32, fontWeight:'800' }}>{currency}{selectedSegObj.value.toLocaleString('en-IN')}</Text>
                <Text style={{ color:'#64748B', fontSize: 16, fontWeight:'700', marginTop: 4 }}>{donutTotal?((selectedSegObj.value/donutTotal*100).toFixed(1)):'0'}%</Text>
              </>
            ) : (
              <>
                <Text style={{ color:'#94A3B8', fontSize: 14, fontWeight:'600', marginBottom: 4 }}>Total</Text>
                <Text style={{ color: '#F8FAFC', fontSize: 32, fontWeight:'800' }}>{currency}{donutTotal.toLocaleString('en-IN')}</Text>
              </>
            )}
          </View>

          <View
            style={{ position:'absolute', width: innerWidth, height: innerHeight }}
            onStartShouldSetResponder={()=>true}
            onMoveShouldSetResponder={()=>true}
            onResponderGrant={(e)=>{ handlePoint(e.nativeEvent.locationX, e.nativeEvent.locationY); }}
            onResponderMove={(e)=>{ handlePoint(e.nativeEvent.locationX, e.nativeEvent.locationY); }}
            onResponderRelease={()=> {}}
            onResponderTerminate={()=> { setDonutSelected(null); }}
          />
        </View>
      </View>
    </View>
  );
};
