import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useMemo } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getExpensesAggregation, type ExpenseFullRow } from '../lib/expenseRatingService';
import { ExpenseDonutChart } from './components/expenseDonutChart';
import { MonthlyExpenseLineChart } from './components/monthlyExpenseLineChart';

const expenseSubTypes = [
  'Drinks','Entertainment','Food','Groceries','Medical','Investments','Other','Personal','Shopping','Travel','Utilities'
];

export default function ChartsScreen() {
  const router = useRouter();
  
  const [fullscreenChart, setFullscreenChart] = React.useState<'line' | 'donut' | null>(null);
  // Add filter state for types
  const [typeFilter, setTypeFilter] = React.useState<string[]>(expenseSubTypes);
  // Modal state
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'start' | 'end'>('start');

  // Default date range state
  const [startMonth, setStartMonth] = React.useState('2023-01');
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
      if (error) {
        console.error('Failed to fetch chart data:', error);
      }
      // Return full rows directly without redefining Type/Date/Amount
      return aggregationData || [];
    },
    enabled: false,
  });
  const chartData = useMemo(() => data ?? [], [data]);

  // Add state for line chart date range
  const allMonths = useMemo(()=>{
    // Generate a list of possible months for the picker, independent of fetched data
    const months = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.add(key);
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  },[]);

  useEffect(() => {
    if (allMonths.length > 0 && !endMonth) {
      setEndMonth(allMonths[0] || ''); // Set to the most recent month
    }
  }, [allMonths, endMonth]);


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

  // Aggregate month totals, filtered by range and type
  const monthAgg = useMemo(()=>{
    console.log('Records for aggregation:', chartData.length);
    if (chartData.length === 0) return [];
    const map: Record<string, number> = {};
    chartData.forEach(r=>{
      if (typeFilter.includes(r.Type)) {
        const d = new Date(r.Date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        map[key] = (map[key]||0)+r.Amount;
      } else {
        console.log('Skipping type', r.Type);
      }
    });
    const entries = Object.entries(map).sort(([a],[b])=> a.localeCompare(b));
    // Filter by start/end
    const startIdx = entries.findIndex(([k])=>k===startMonth);
    const endIdx = entries.findIndex(([k])=>k===endMonth);
    if (startIdx === -1 || endIdx === -1) return entries;
    return entries.slice(Math.min(startIdx,endIdx), Math.max(startIdx,endIdx)+1);
  },[chartData, startMonth, endMonth, typeFilter]);

  // Aggregate by type, filtered
  const typeAgg = useMemo(()=>{
    if (chartData.length === 0) return [];
    const map: Record<string, number> = {};
    chartData.forEach(r=>{ if (typeFilter.includes(r.Type)) map[r.Type] = (map[r.Type]||0)+r.Amount; });
    return Object.entries(map).sort((a,b)=> b[1]-a[1]);
  },[chartData, typeFilter]);

  const singleSelectedType = useMemo(()=> typeFilter.length === 1 ? typeFilter[0] : null, [typeFilter]);

  // Build subtype aggregation when a single type is selected
  const subtypeAgg = useMemo(() => {
    if (!singleSelectedType) return [] as [string, number][];
    // Map expense Type to possible subtype field names in data
    const subtypeFieldMap: Record<string, string[]> = {
      Food: ['Meal'],
      Drinks: ['Drink'],
      Groceries: ['Grocery'],
      Travel: ['Travel'],
      Shopping: ['Shopping'],
      Utilities: ['Utility'],
      Entertainment: ['Entertainment'],
      Medical: ['Health'],
      Investments: ['Investments'],
      Personal: [],
      Other: []
    };
    const fields = subtypeFieldMap[singleSelectedType] || [];
    if (!fields.length) return [];
    const map: Record<string, number> = {};
    chartData.forEach(r => {
      if (r.Type !== singleSelectedType) return;
      // Use first non-empty field among the list as label priority
      let label: string | undefined;
      for (const f of fields) {
        const val = (r as any)[f];
        if (val && typeof val === 'string') { label = val; break; }
      }
      if (!label) label = singleSelectedType;
      map[label] = (map[label] || 0) + r.Amount;
    });
    return Object.entries(map).sort((a,b)=> b[1]-a[1]);
  }, [chartData, singleSelectedType]);

  const donutDataToUse = singleSelectedType && subtypeAgg.length > 0 ? subtypeAgg : typeAgg;
  const donutTitle = singleSelectedType && subtypeAgg.length > 0 ? `${singleSelectedType} Spread` : 'Expense Type Breakdown';
  const legendLabel = singleSelectedType && subtypeAgg.length > 0 ? 'Subtypes' : 'Types';

  // Orientation handling only for line chart now
  const enterFullscreen = async (type: 'line' | 'donut') => {
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
      <LinearGradient colors={['#0f2027','#203a43']} style={{ flex:1 }}>
        {isLine ? (
          <MonthlyExpenseLineChart monthAgg={monthAgg} onClose={exitFullscreen} />
        ) : (
          <ExpenseDonutChart typeAgg={donutDataToUse} onClose={exitFullscreen} title={donutTitle} legendLabel={legendLabel} />
        )}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#141E30','#243B55']} style={{ flex:1, paddingTop: 60 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        <Text style={{ color:'#fff', fontSize:26, fontWeight:'700', textAlign:'center', marginBottom:24 }}>Expense Charts</Text>

        {/* FILTERS MOVED HERE */}
        <Text style={{ color:'#90CAF9', fontSize:16, marginBottom:8 }}>Filters</Text>
        
        {/* Date range filter for line chart */}
        <View style={{ marginBottom:18, backgroundColor: '#1E2A38', padding: 16, borderRadius: 14 }}>
          <Text style={{ color:'#fff', fontSize:15, fontWeight:'600', marginBottom:12 }}>Line Chart Date Range</Text>
          <View style={{ flexDirection:'row', gap:16, justifyContent: 'space-around' }}>
            <View style={{ alignItems:'center', gap:4 }}>
              <Text style={{ color:'#90CAF9', fontSize:13 }}>Start Month</Text>
              <View style={{ backgroundColor:'#263238', borderRadius:8, paddingHorizontal:12, paddingVertical:6 }}>
                <TouchableOpacity onPress={()=>openModal('start')}>
                  <Text style={{ color:'#fff', fontSize:14, fontWeight: '600' }}>{startMonth}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ alignItems:'center', gap:4 }}>
              <Text style={{ color:'#90CAF9', fontSize:13 }}>End Month</Text>
              <View style={{ backgroundColor:'#263238', borderRadius:8, paddingHorizontal:12, paddingVertical:6 }}>
                <TouchableOpacity onPress={()=>openModal('end')}>
                  <Text style={{ color:'#fff', fontSize:14, fontWeight: '600' }}>{endMonth}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Filter UI for Expense Spread */}
        <View style={{ marginBottom:24, backgroundColor: '#1E2A38', padding: 16, borderRadius: 14 }}>
          <Text style={{ color:'#fff', fontSize:15, fontWeight:'600', marginBottom:12 }}>Filter Expense Types</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
            {expenseSubTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={{ backgroundColor: typeFilter.includes(type) ? '#42A5F5' : '#263238', borderRadius:8, paddingHorizontal:10, paddingVertical:6 }}
                onPress={()=> setTypeFilter(f => f.includes(type) ? f.filter(t=>t!==type) : [...f, type])}
              >
                <Text style={{ color: typeFilter.includes(type) ? '#fff' : '#90CAF9', fontSize:13 }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BUTTON MOVED HERE */}
        <TouchableOpacity onPress={() => refetch()} disabled={isLoading} style={styles.fetchButton}>
          <Text style={styles.fetchButtonText}>{isLoading ? 'Generating...' : 'Generate Chart Data'}</Text>
        </TouchableOpacity>

        {/* CHART PREVIEWS - RENDERED CONDITIONALLY */}
        {chartData.length > 0 && (
          <>
            <Text style={{ color:'#90CAF9', fontSize:16, marginBottom:8, marginTop: 24 }}>Charts</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:16, marginBottom:32 }}>
              <TouchableOpacity style={{ width:'48%', backgroundColor:'#1E2A38', borderRadius:14, padding:16, alignItems:'center', justifyContent:'center', height:180 }} onPress={()=>enterFullscreen('line')}>
                <Text style={{ color:'#fff', fontSize:16, fontWeight:'600', marginBottom:8 }}>Monthly Line</Text>
                <View style={{ width:80, height:80, backgroundColor:'#263238', borderRadius:8, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#90CAF9', fontSize:32 }}>📈</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ width:'48%', backgroundColor:'#1E2A38', borderRadius:14, padding:16, alignItems:'center', justifyContent:'center', height:180 }} onPress={()=>enterFullscreen('donut')}>
                <Text style={{ color:'#fff', fontSize:16, fontWeight:'600', marginBottom:8 }}>Expense Spread</Text>
                <View style={{ width:80, height:80, backgroundColor:'#263238', borderRadius:40, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#FFA726', fontSize:32 }}>🍩</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
        <TouchableOpacity onPress={()=>router.back()} style={{ alignSelf:'center', marginTop: chartData.length > 0 ? 0 : 24 }}>
          <Text style={{ color:'#fff', textDecorationLine:'underline', fontSize:16 }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {modalMode === 'start' ? 'Start' : 'End'} Month</Text>
            <FlatList
              data={allMonths}
              keyExtractor={item => item}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              renderItem={({ item }) => {
                const isSelected = item === startMonth || item === endMonth;
                const isStart = item === startMonth;
                const isEnd = item === endMonth;
                return (
                  <TouchableOpacity style={styles.monthItem} onPress={() => handleMonthSelect(item)}>
                    <Text style={[styles.monthText, isSelected && styles.selectedMonthText]}>
                      {item}
                      {isStart && isEnd ? ' (Start & End)' : isStart ? ' (Start)' : isEnd ? ' (End)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              style={{ width: '100%' }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={{ color: '#90CAF9' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#1E2A38',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  monthItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#263238',
    width: '100%',
    alignItems: 'center',
  },
  monthText: {
    color: '#CFD8DC',
    fontSize: 16,
  },
  selectedMonthText: {
    color: '#42A5F5',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
  },
  fetchButton: {
    backgroundColor: '#42A5F5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
