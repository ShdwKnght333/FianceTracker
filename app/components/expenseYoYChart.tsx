import { Canvas, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface YoYChartProps {
  /** Raw expense rows for the single selected category (all dates) */
  data: { Date: string; Amount: number }[];
  category: string;
  currency?: string;
  onClose?: () => void;
}

const YEAR_COLORS = ['#6366F1','#10B981','#F43F5E','#F59E0B','#06B6D4','#EC4899','#8B5CF6','#84CC16','#3B82F6','#14B8A6'];

export const ExpenseYoYChart: React.FC<YoYChartProps> = ({
  data,
  category,
  currency = '₹',
  onClose,
}) => {
  const dims = useWindowDimensions();
  const [animProgress, setAnimProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    setAnimProgress(0);
    const duration = 900;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let start: number | null = null;
    const step = (ts: number) => {
      if (start == null) start = ts;
      const raw = Math.min(1, (ts - start) / duration);
      setAnimProgress(ease(raw));
      if (raw < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data]);

  // Aggregate: year -> total
  const { yearTotals, maxVal } = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      const year = String(new Date(r.Date).getFullYear());
      map[year] = (map[year] || 0) + r.Amount;
    });
    const totals = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const mx = totals.reduce((m, [, v]) => Math.max(m, v), 1);
    return { yearTotals: totals, maxVal: mx };
  }, [data]);

  const padLeft = 56;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 50;
  const chartWidth = dims.width;
  const chartHeight = dims.height - 180;
  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const barWidth = useMemo(() => {
    const count = yearTotals.length;
    if (count === 0) return 0;
    const gap = Math.max(12, innerW / count * 0.35);
    return Math.min(64, (innerW - gap * (count - 1)) / count);
  }, [yearTotals, innerW]);

  const barGap = useMemo(() => {
    const count = yearTotals.length;
    if (count <= 1) return 0;
    return (innerW - barWidth * count) / (count - 1);
  }, [yearTotals, innerW, barWidth]);

  const handleTouch = useCallback((e: any) => {
    const x = e.nativeEvent.locationX - padLeft;
    const count = yearTotals.length;
    if (count === 0) return;
    const idx = Math.round(x / (barWidth + barGap));
    setSelectedIdx(Math.max(0, Math.min(count - 1, idx)));
  }, [yearTotals, barWidth, barGap]);

  const formatAmount = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const yTicks = 4;

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '800' }}>{category} — Year over Year</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12 }}>
            <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected bar detail */}
      {selectedIdx != null && yearTotals[selectedIdx] && (
        <View style={{ paddingHorizontal: 24, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 24, borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 12, height: 12, backgroundColor: YEAR_COLORS[selectedIdx % YEAR_COLORS.length], borderRadius: 4, marginRight: 8 }} />
              <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 18 }}>{yearTotals[selectedIdx][0]}</Text>
            </View>
            <Text style={{ color: '#F8FAFC', fontWeight: '800', fontSize: 20 }}>{currency}{yearTotals[selectedIdx][1].toLocaleString('en-IN')}</Text>
          </View>
          {selectedIdx > 0 && (() => {
            const curr = yearTotals[selectedIdx][1];
            const prev = yearTotals[selectedIdx - 1][1];
            if (prev === 0) return null;
            const pct = ((curr - prev) / prev * 100).toFixed(1);
            const isUp = curr >= prev;
            return (
              <Text style={{ color: isUp ? '#F43F5E' : '#10B981', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                {isUp ? '↑' : '↓'} {Math.abs(Number(pct))}% vs {yearTotals[selectedIdx - 1][0]}
              </Text>
            );
          })()}
        </View>
      )}

      {/* Chart */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Y-axis labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const value = (maxVal / yTicks) * i;
          const y = padTop + innerH - (i / yTicks) * innerH;
          return (
            <Text key={i} style={{ position: 'absolute', left: 8, top: y - 8, color: '#475569', fontSize: 10, fontWeight: '500' }}>
              {currency}{formatAmount(value)}
            </Text>
          );
        })}

        <View style={{ width: chartWidth, height: chartHeight }}>
          <Canvas style={{ width: chartWidth, height: chartHeight }}>
            {/* Grid */}
            {(() => {
              const grid = Skia.Path.Make();
              for (let i = 0; i <= yTicks; i++) {
                const y = padTop + innerH - (i / yTicks) * innerH;
                grid.moveTo(padLeft, y);
                grid.lineTo(chartWidth - padRight, y);
              }
              return <Path path={grid} color="rgba(255,255,255,0.05)" style="stroke" strokeWidth={1} />;
            })()}

            {/* Bars */}
            {yearTotals.map(([, total], idx) => {
              const barH = (total / maxVal) * innerH * animProgress;
              const x = padLeft + idx * (barWidth + barGap);
              const y = padTop + innerH - barH;
              const color = YEAR_COLORS[idx % YEAR_COLORS.length];
              const isSelected = selectedIdx === idx;
              const fillColor = selectedIdx != null ? (isSelected ? color : color + '44') : color;
              return (
                <RoundedRect
                  key={idx}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(0, barH)}
                  r={4}
                  color={fillColor}
                />
              );
            })}
          </Canvas>

          {/* X-axis year labels */}
          {yearTotals.map(([year], idx) => {
            const x = padLeft + idx * (barWidth + barGap) + barWidth / 2;
            return (
              <Text
                key={year}
                style={{
                  position: 'absolute',
                  left: x - 20,
                  bottom: 8,
                  width: 40,
                  textAlign: 'center',
                  color: selectedIdx === idx ? '#F8FAFC' : '#475569',
                  fontSize: 12,
                  fontWeight: selectedIdx === idx ? '700' : '500',
                }}
              >
                {year}
              </Text>
            );
          })}

          {/* Touch overlay */}
          <View
            style={{ position: 'absolute', left: 0, top: 0, width: chartWidth, height: chartHeight }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouch}
            onResponderMove={handleTouch}
            onResponderRelease={() => setSelectedIdx(null)}
            onResponderTerminate={() => setSelectedIdx(null)}
          />
        </View>
      </View>
    </View>
  );
};
