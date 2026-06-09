import { Canvas, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface StackedBarChartProps {
  /** Map of month -> { category -> amount } */
  monthCategoryAgg: [string, Record<string, number>][];
  categories: string[];
  colors?: string[];
  currency?: string;
  onClose?: () => void;
}

const DEFAULT_COLORS = [
  '#10B981','#6366F1','#F43F5E','#F59E0B','#8B5CF6',
  '#06B6D4','#EC4899','#84CC16','#64748B','#3B82F6','#14B8A6',
];

export const ExpenseStackedBarChart: React.FC<StackedBarChartProps> = ({
  monthCategoryAgg,
  categories,
  colors = DEFAULT_COLORS,
  currency = '₹',
  onClose,
}) => {
  const dims = useWindowDimensions();
  const [animProgress, setAnimProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [tooltip, setTooltip] = useState<{ monthIdx: number; month: string; breakdown: [string, number][] } | null>(null);

  // animate bars in
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
  }, [monthCategoryAgg]);

  const padLeft = 56;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 60;
  const chartWidth = dims.width;
  const chartHeight = dims.height - 160;
  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const maxTotal = useMemo(() => {
    let m = 0;
    for (const [, cats] of monthCategoryAgg) {
      const total = Object.values(cats).reduce((s, v) => s + v, 0);
      if (total > m) m = total;
    }
    return Math.max(m, 1);
  }, [monthCategoryAgg]);

  const barWidth = useMemo(() => {
    const count = monthCategoryAgg.length;
    if (count === 0) return 0;
    const gap = Math.max(4, innerW / count * 0.3);
    return Math.min(48, (innerW - gap * (count - 1)) / count);
  }, [monthCategoryAgg, innerW]);

  const barGap = useMemo(() => {
    const count = monthCategoryAgg.length;
    if (count <= 1) return 0;
    return (innerW - barWidth * count) / (count - 1);
  }, [monthCategoryAgg, innerW, barWidth]);

  const handleTouch = useCallback((e: any) => {
    const x = e.nativeEvent.locationX - padLeft;
    const count = monthCategoryAgg.length;
    if (count === 0) return;
    const idx = Math.round(x / (barWidth + barGap));
    const clamped = Math.max(0, Math.min(count - 1, idx));
    const [month, cats] = monthCategoryAgg[clamped];
    const breakdown: [string, number][] = categories
      .map(c => [c, cats[c] || 0] as [string, number])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
    setTooltip({ monthIdx: clamped, month, breakdown });
  }, [monthCategoryAgg, categories, barWidth, barGap]);

  // Y-axis labels
  const yTicks = 4;
  const yLabels = useMemo(() => {
    const labels: { value: number; y: number }[] = [];
    for (let i = 0; i <= yTicks; i++) {
      const value = (maxTotal / yTicks) * i;
      const y = padTop + innerH - (i / yTicks) * innerH;
      labels.push({ value, y });
    }
    return labels;
  }, [maxTotal, innerH]);

  const formatAmount = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '800' }}>Monthly Breakdown</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12 }}>
            <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, marginTop: 12 }}>
        {categories.map((cat, idx) => (
          <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
            <View style={{ width: 10, height: 10, backgroundColor: colors[idx % colors.length], borderRadius: 3, marginRight: 4 }} />
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '500' }}>{cat}</Text>
          </View>
        ))}
      </View>

      {/* Tooltip */}
      {tooltip && (
        <View style={{ paddingHorizontal: 24, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 24, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>{tooltip.month}</Text>
          {tooltip.breakdown.map(([cat, amt]) => {
            const idx = categories.indexOf(cat);
            return (
              <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, backgroundColor: colors[idx % colors.length], borderRadius: 2, marginRight: 6 }} />
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>{cat}</Text>
                </View>
                <Text style={{ color: '#F8FAFC', fontSize: 12, fontWeight: '600' }}>{currency}{amt.toLocaleString('en-IN')}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Chart */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Y-axis labels */}
        {yLabels.map(({ value, y }) => (
          <Text key={value} style={{ position: 'absolute', left: 8, top: y - 8, color: '#475569', fontSize: 10, fontWeight: '500' }}>
            {currency}{formatAmount(value)}
          </Text>
        ))}

        <View style={{ width: chartWidth, height: chartHeight }}>
          <Canvas style={{ width: chartWidth, height: chartHeight }}>
            {/* Grid lines */}
            {(() => {
              const grid = Skia.Path.Make();
              for (let i = 0; i <= yTicks; i++) {
                const y = padTop + innerH - (i / yTicks) * innerH;
                grid.moveTo(padLeft, y);
                grid.lineTo(chartWidth - padRight, y);
              }
              return <Path path={grid} color="rgba(255,255,255,0.05)" style="stroke" strokeWidth={1} />;
            })()}

            {/* Stacked bars */}
            {monthCategoryAgg.map(([, cats], mIdx) => {
              let yOffset = 0;
              return categories.map((cat, cIdx) => {
                const val = cats[cat] || 0;
                if (val === 0) return null;
                const segH = (val / maxTotal) * innerH * animProgress;
                const x = padLeft + mIdx * (barWidth + barGap);
                const y = padTop + innerH - yOffset - segH;
                yOffset += segH;
                const isHighlighted = tooltip?.monthIdx === mIdx;
                const color = colors[cIdx % colors.length];
                const fillColor = isHighlighted ? color : tooltip ? color + '55' : color;
                return (
                  <RoundedRect
                    key={`${mIdx}-${cat}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, segH)}
                    r={segH > 4 ? 2 : 0}
                    color={fillColor}
                  />
                );
              });
            })}
          </Canvas>

          {/* X-axis labels */}
          {monthCategoryAgg.map(([month], mIdx) => {
            const x = padLeft + mIdx * (barWidth + barGap) + barWidth / 2;
            const shortLabel = month.slice(2); // "2024-03" -> "24-03"
            return (
              <Text
                key={month}
                style={{
                  position: 'absolute',
                  left: x - 18,
                  bottom: 8,
                  width: 36,
                  textAlign: 'center',
                  color: tooltip?.monthIdx === mIdx ? '#F8FAFC' : '#475569',
                  fontSize: 9,
                  fontWeight: tooltip?.monthIdx === mIdx ? '700' : '500',
                }}
              >
                {shortLabel}
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
            onResponderRelease={() => setTooltip(null)}
            onResponderTerminate={() => setTooltip(null)}
          />
        </View>
      </View>
    </View>
  );
};
