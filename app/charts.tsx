import { useQuery } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useMemo } from 'react';
import { FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getExpensesAggregation, type ExpenseFullRow } from '../lib/expenseRatingService';
import { ExpenseDonutChart } from './components/expenseDonutChart';
import { ExpenseStackedBarChart } from './components/expenseStackedBarChart';
import { ExpenseYoYChart } from './components/expenseYoYChart';
import { GlassCard } from './components/GlassCard';
import { MonthlyExpenseLineChart } from './components/monthlyExpenseLineChart';

// Maps each expense Type to its sub-type field key in ExpenseFullRow
const subTypeFieldMap: Record<string, string> = {
  Food: 'Meal',
  Drinks: 'Drink',
  Groceries: 'Grocery',
  Travel: 'Travel',
  Shopping: 'Shopping',
  Utilities: 'Utility',
  Entertainment: 'Entertainment',
  Medical: 'Health',
  Investments: 'Investments',
};

const expenseSubTypes = [
  'Drinks','Entertainment','Food','Groceries','Medical','Investments','Other','Personal','Shopping','Travel','Utilities'
];

export default function ChartsScreen() {
  const router = useRouter();
  
  const [fullscreenChart, setFullscreenChart] = React.useState<'line' | 'donut' | 'stacked' | 'yoy' | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<string[]>(expenseSubTypes);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'start' | 'end'>('start');

  const [startMonth, setStartMonth] = React.useState(() => `${new Date().getFullYear()}-01`);
  const [endMonth, setEndMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data, refetch, isLoading } = useQuery<ExpenseFullRow[]>({
    queryKey: ['expenseData', startMonth, endMonth, typeFilter],
    queryFn: async () => {
      if (!startMonth || !endMonth) return [];
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      const lastDayOfMonth = new Date(endYear, endMonthNum, 0).getDate();
      const startDate = `${startMonth}-01`;
      const endDate = `${endMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;
      const { data: aggregationData, error } = await getExpensesAggregation(startDate, endDate, typeFilter);
      if (error) console.error('Failed to fetch chart data:', error);
      return aggregationData || [];
    },
    enabled: false,
  });
  const chartData = useMemo(() => data ?? [], [data]);

  const allMonths = useMemo(()=>{
    const months = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.add(key);
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  },[]);

  const openModal = (mode: 'start' | 'end') => {
    setModalMode(mode);
    setIsModalVisible(true);
  };

  const handleMonthSelect = (month: string) => {
    if (modalMode === 'start') {
      setStartMonth(month);
      if (month > endMonth) setEndMonth(month);
    } else {
      setEndMonth(month);
      if (month < startMonth) setStartMonth(month);
    }
    setIsModalVisible(false);
  };

  const monthAgg = useMemo(()=>{
    if (chartData.length === 0) return [];
    const map: Record<string, number> = {};
    chartData.forEach(r=>{
      if (typeFilter.includes(r.Type)) {
        const d = new Date(r.Date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        map[key] = (map[key]||0)+r.Amount;
      }
    });
    const entries = Object.entries(map).sort(([a],[b])=> a.localeCompare(b));
    const startIdx = entries.findIndex(([k])=>k===startMonth);
    const endIdx = entries.findIndex(([k])=>k===endMonth);
    if (startIdx === -1 || endIdx === -1) return entries;
    return entries.slice(Math.min(startIdx,endIdx), Math.max(startIdx,endIdx)+1);
  },[chartData, startMonth, endMonth, typeFilter]);

  const typeAgg = useMemo(()=>{
    if (chartData.length === 0) return [];
    const map: Record<string, number> = {};
    chartData.forEach(r=>{ if (typeFilter.includes(r.Type)) map[r.Type] = (map[r.Type]||0)+r.Amount; });
    return Object.entries(map).sort((a,b)=> b[1]-a[1]);
  },[chartData, typeFilter]);

  // When exactly 1 category is selected, break donut down by sub-type
  const isSingleCategory = typeFilter.length === 1;
  const donutAgg = useMemo(() => {
    if (!isSingleCategory || chartData.length === 0) return typeAgg;
    const category = typeFilter[0];
    const field = subTypeFieldMap[category];
    if (!field) return typeAgg; // no sub-type mapping, fall back
    const map: Record<string, number> = {};
    chartData.forEach(r => {
      if (r.Type !== category) return;
      const subVal = (r as any)[field] as string | undefined;
      const key = subVal || 'Unknown';
      map[key] = (map[key] || 0) + r.Amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [chartData, typeFilter, isSingleCategory, typeAgg]);

  const donutTitle = isSingleCategory ? `${typeFilter[0]} — Sub-type Breakdown` : 'Expense Breakdown';
  const donutLegend = isSingleCategory ? 'Sub-types' : 'Types';

  // Stacked bar data: month -> { category/sub-type -> amount }
  const monthCategoryAgg = useMemo(() => {
    if (chartData.length === 0) return [];
    const map: Record<string, Record<string, number>> = {};
    if (isSingleCategory) {
      const category = typeFilter[0];
      const field = subTypeFieldMap[category];
      chartData.forEach(r => {
        if (r.Type !== category) return;
        const d = new Date(r.Date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = {};
        const subVal = field ? ((r as any)[field] as string | undefined) || 'Unknown' : r.Type;
        map[key][subVal] = (map[key][subVal] || 0) + r.Amount;
      });
    } else {
      chartData.forEach(r => {
        if (!typeFilter.includes(r.Type)) return;
        const d = new Date(r.Date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = {};
        map[key][r.Type] = (map[key][r.Type] || 0) + r.Amount;
      });
    }
    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const startIdx = entries.findIndex(([k]) => k === startMonth);
    const endIdx = entries.findIndex(([k]) => k === endMonth);
    if (startIdx === -1 || endIdx === -1) return entries;
    return entries.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
  }, [chartData, startMonth, endMonth, typeFilter, isSingleCategory]);

  const activeCategories = useMemo(() => {
    const set = new Set<string>();
    monthCategoryAgg.forEach(([, cats]) => Object.keys(cats).forEach(c => set.add(c)));
    if (isSingleCategory) return Array.from(set).sort();
    return expenseSubTypes.filter(t => set.has(t));
  }, [monthCategoryAgg, isSingleCategory]);

  // YoY: fetch ALL data for all selected categories across all years (ignores date range)
  const { data: yoyData } = useQuery<ExpenseFullRow[]>({
    queryKey: ['yoyData', typeFilter],
    queryFn: async () => {
      const { data: rows, error } = await getExpensesAggregation('2024-01-01', '2099-12-31', typeFilter);
      if (error) console.error('Failed to fetch YoY data:', error);
      return rows || [];
    },
    enabled: chartData.length > 0,
  });
  const yoyChartData = useMemo(() => yoyData ?? [], [yoyData]);
  const yoyLabel = isSingleCategory ? typeFilter[0] : typeFilter.length === expenseSubTypes.length ? 'All Categories' : typeFilter.join(', ');

  const enterFullscreen = async (type: 'line' | 'donut' | 'stacked' | 'yoy') => {
    setFullscreenChart(type);
    if (type === 'line') {
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); } catch {}
    }
  };
  const exitFullscreen = async () => {
    const wasLine = fullscreenChart === 'line';
    setFullscreenChart(null);
    if (wasLine) {
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch {}
    }
  };

  if (fullscreenChart) {
    const isLine = fullscreenChart==='line';
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden />
        <LinearGradient colors={['#0F172A','#020617']} style={{ flex:1 }}>
          {isLine ? (
            <MonthlyExpenseLineChart monthAgg={monthAgg} onClose={exitFullscreen} />
          ) : fullscreenChart === 'donut' ? (
            <ExpenseDonutChart typeAgg={donutAgg} onClose={exitFullscreen} title={donutTitle} legendLabel={donutLegend} />
          ) : fullscreenChart === 'stacked' ? (
            <ExpenseStackedBarChart monthCategoryAgg={monthCategoryAgg} categories={activeCategories} onClose={exitFullscreen} />
          ) : (
            <ExpenseYoYChart data={yoyChartData} category={yoyLabel} onClose={exitFullscreen} />
          )}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F172A','#020617']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
          <Text style={styles.title}>Financial Insights</Text>

          <GlassCard style={styles.filterCard} intensity={20}>
            <Text style={styles.sectionLabel}>Date Range</Text>
            <View style={styles.dateRangeRow}>
              <TouchableOpacity style={styles.dateButton} onPress={()=>openModal('start')}>
                <Text style={styles.dateButtonLabel}>Start</Text>
                <Text style={styles.dateButtonValue}>{startMonth}</Text>
              </TouchableOpacity>
              <View style={styles.dateDivider} />
              <TouchableOpacity style={styles.dateButton} onPress={()=>openModal('end')}>
                <Text style={styles.dateButtonLabel}>End</Text>
                <Text style={styles.dateButtonValue}>{endMonth}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Categories</Text>
            <View style={styles.chipGrid}>
              {expenseSubTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, typeFilter.includes(type) && styles.chipActive]}
                  onPress={()=> setTypeFilter(f => f.includes(type) ? f.filter(t=>t!==type) : [...f, type])}
                >
                  <Text style={[styles.chipText, typeFilter.includes(type) && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => refetch()} disabled={isLoading} style={styles.generateButton}>
              <Text style={styles.generateButtonText}>{isLoading ? 'Analyzing...' : 'Generate Report'}</Text>
            </TouchableOpacity>
          </GlassCard>

          {chartData.length > 0 && (
            <View style={styles.chartGrid}>
              <TouchableOpacity style={styles.chartItem} onPress={()=>enterFullscreen('line')}>
                <GlassCard style={styles.chartInner} intensity={15}>
                  <Text style={styles.chartIcon}>📈</Text>
                  <Text style={styles.chartTitle}>Monthly Trend</Text>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartItem} onPress={()=>enterFullscreen('donut')}>
                <GlassCard style={styles.chartInner} intensity={15}>
                  <Text style={styles.chartIcon}>🍩</Text>
                  <Text style={styles.chartTitle}>{isSingleCategory ? `${typeFilter[0]} Sub-types` : 'Expense Spread'}</Text>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartItem} onPress={()=>enterFullscreen('stacked')}>
                <GlassCard style={styles.chartInner} intensity={15}>
                  <Text style={styles.chartIcon}>📊</Text>
                  <Text style={styles.chartTitle}>{isSingleCategory ? `${typeFilter[0]} Sub-type Stack` : 'Stacked Breakdown'}</Text>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartItem} onPress={()=>enterFullscreen('yoy')}>
                <GlassCard style={styles.chartInner} intensity={15}>
                  <Text style={styles.chartIcon}>📅</Text>
                  <Text style={styles.chartTitle}>{isSingleCategory ? `${typeFilter[0]} ` : ''}Year over Year</Text>
                </GlassCard>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={()=>router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity={40}>
            <Text style={styles.modalTitle}>Select {modalMode === 'start' ? 'Start' : 'End'} Month</Text>
            <FlatList
              data={allMonths}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.monthItem} onPress={() => handleMonthSelect(item)}>
                  <Text style={[styles.monthText, (item === startMonth || item === endMonth) && styles.selectedMonthText]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  title: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 24 },
  filterCard: { padding: 20, borderRadius: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  dateRangeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4 },
  dateButton: { flex: 1, padding: 12, alignItems: 'center' },
  dateButtonLabel: { fontSize: 10, color: '#64748B', marginBottom: 2 },
  dateButtonValue: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  dateDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  generateButton: { backgroundColor: '#3B82F6', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 24 },
  chartItem: { width: '47%' },
  chartInner: { height: 140, justifyContent: 'center', alignItems: 'center' },
  chartIcon: { fontSize: 32, marginBottom: 8 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  backButton: { marginTop: 40, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxHeight: '70%', padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 20, textAlign: 'center' },
  monthItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  monthText: { fontSize: 16, color: '#94A3B8' },
  selectedMonthText: { color: '#10B981', fontWeight: '800' },
  closeButton: { marginTop: 16, alignItems: 'center' },
  closeButtonText: { color: '#3B82F6', fontSize: 16, fontWeight: '700' }
});
