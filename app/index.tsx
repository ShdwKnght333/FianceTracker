import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ExpenseFullRow, getExpensesAggregation, getMonthlyTotal, getRecentTransactions, getYearlyTotal } from "../lib/expenseRatingService";
import { GlassCard } from "./components/GlassCard";

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const allTypes = ['Drinks', 'Entertainment', 'Food', 'Groceries', 'Medical', 'Investments', 'Other', 'Personal', 'Shopping', 'Travel', 'Utilities'];
  const typeIcons: Record<string, string> = {
    Food: '🍽️', Drinks: '🍹', Groceries: '🛒', Travel: '🚗', Shopping: '🛍️',
    Utilities: '💡', Entertainment: '🎬', Medical: '💊', Investments: '📈',
    Personal: '👤', Other: '📦',
  };
  const spotlightType = useRef<string>(allTypes[Math.floor(Math.random() * allTypes.length)]).current;

  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [yearlySpent, setYearlySpent] = useState<number>(0);
  const [sixMonthAvg, setSixMonthAvg] = useState<number | null>(null);
  const [spotlightTotal, setSpotlightTotal] = useState<number>(0);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseFullRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const cardScrollRef = useRef<ScrollView>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthName = lastMonth.toLocaleString('default', { month: 'long' });
    const year = String(lastMonth.getFullYear());
    const currentYear = String(now.getFullYear());

    // 6 months preceding last month (months -7 to -2 relative to now)
    const avgStart = new Date(now.getFullYear(), now.getMonth() - 7, 1);
    const avgEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    const avgStartStr = `${avgStart.getFullYear()}-${String(avgStart.getMonth() + 1).padStart(2, '0')}-01`;
    const avgEndStr = `${avgEnd.getFullYear()}-${String(avgEnd.getMonth() + 1).padStart(2, '0')}-${String(avgEnd.getDate()).padStart(2, '0')}`;
    // Last 6 full months for spotlight card
    const spotlightStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const spotlightEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const spotlightStartStr = `${spotlightStart.getFullYear()}-${String(spotlightStart.getMonth() + 1).padStart(2, '0')}-01`;
    const spotlightEndStr = `${spotlightEnd.getFullYear()}-${String(spotlightEnd.getMonth() + 1).padStart(2, '0')}-${String(spotlightEnd.getDate()).padStart(2, '0')}`;

    const [total, yearly, recent, sixMonthData, spotlightData] = await Promise.all([
      getMonthlyTotal(monthName, year),
      getYearlyTotal(currentYear),
      getRecentTransactions(5),
      getExpensesAggregation(avgStartStr, avgEndStr, allTypes),
      getExpensesAggregation(spotlightStartStr, spotlightEndStr, [spotlightType]),
    ]);

    const sixMonthSum = (sixMonthData.data || []).reduce((s, r) => s + r.Amount, 0);
    setSixMonthAvg(sixMonthSum / 6);
    setSpotlightTotal((spotlightData.data || []).reduce((s, r) => s + r.Amount, 0));
    setTotalSpent(total);
    setYearlySpent(yearly);
    setRecentExpenses(recent);
    setLoading(false);
  };

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0F172A", "#020617"]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Gradients */}
      <View style={[styles.circle, { top: -100, right: -100, backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} />
      <View style={[styles.circle, { bottom: -150, left: -100, backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>
            <View style={styles.profileBadge}>
              <Text style={styles.profileInitial}>S</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Swipable Expenditure Cards */}
            <View style={styles.cardCarousel}>
              <ScrollView
                ref={cardScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (width - 48));
                  setActiveCardIndex(index);
                }}
                decelerationRate="fast"
                snapToInterval={width - 48}
                contentContainerStyle={{ gap: 0 }}
              >
                <GlassCard style={{ ...styles.mainCard, width: width - 48 }} intensity={40}>
                  <Text style={styles.cardLabel}>Last Month's Expenditure</Text>
                  <Text style={styles.cardAmount}>{loading ? "..." : formatCurrency(totalSpent)}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.trendContainer}>
                      {(() => {
                        if (loading || sixMonthAvg === null || sixMonthAvg === 0) {
                          return <Text style={styles.trendText}>—</Text>;
                        }
                        const pct = ((totalSpent - sixMonthAvg) / sixMonthAvg) * 100;
                        const isUp = pct >= 0;
                        return (
                          <>
                            <Text style={styles.trendIcon}>{isUp ? '📈' : '📉'}</Text>
                            <Text style={[styles.trendText, { color: isUp ? '#F43F5E' : '#10B981' }]}>
                              {isUp ? '+' : ''}{pct.toFixed(1)}% vs 6-month avg
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  </View>
                </GlassCard>

                <GlassCard style={{ ...styles.mainCard, width: width - 48 }} intensity={40}>
                  <Text style={styles.cardLabel}>{new Date().getFullYear()} Expenditure (Year to Date)</Text>
                  <Text style={styles.cardAmount}>{loading ? "..." : formatCurrency(yearlySpent)}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.trendContainer}>
                      <Text style={styles.trendIcon}>📅</Text>
                      <Text style={styles.trendText}>Year-to-date spending</Text>
                    </View>
                  </View>
                </GlassCard>

                <GlassCard style={{ ...styles.mainCard, width: width - 48 }} intensity={40}>
                  <Text style={styles.cardLabel}>{typeIcons[spotlightType]} {spotlightType} — Last 6 Months</Text>
                  <Text style={styles.cardAmount}>{loading ? "..." : formatCurrency(spotlightTotal)}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.trendContainer}>
                      <Text style={styles.trendIcon}>🗓️</Text>
                      <Text style={styles.trendText}>Total spend over last 6 months</Text>
                    </View>
                  </View>
                </GlassCard>
              </ScrollView>
              <View style={styles.paginationDots}>
                <View style={[styles.dot, activeCardIndex === 0 && styles.dotActive]} />
                <View style={[styles.dot, activeCardIndex === 1 && styles.dotActive]} />
                <View style={[styles.dot, activeCardIndex === 2 && styles.dotActive]} />
              </View>
            </View>

            <View style={styles.grid}>
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.gridItem}
                onPress={() => handleNavigate('/expenseForm')}
              >
                <GlassCard intensity={25}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={styles.actionIcon}>➕</Text>
                  </View>
                  <Text style={styles.actionTitle}>Add Expense</Text>
                  <Text style={styles.actionDesc}>Quick entry</Text>
                </GlassCard>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.gridItem}
                onPress={() => handleNavigate('/charts')}
              >
                <GlassCard intensity={25}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Text style={styles.actionIcon}>📊</Text>
                  </View>
                  <Text style={styles.actionTitle}>Insights</Text>
                  <Text style={styles.actionDesc}>View charts</Text>
                </GlassCard>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => handleNavigate('/charts')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, index) => (
                <GlassCard key={index} style={styles.transactionCard} intensity={15}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionIconContainer}>
                      <Text style={styles.transactionIcon}>
                        {expense.Type === 'Food' ? '🍽️' : 
                         expense.Type === 'Drinks' ? '🍹' :
                         expense.Type === 'Groceries' ? '🛒' :
                         expense.Type === 'Travel' ? '🚗' :
                         expense.Type === 'Shopping' ? '🛍️' :
                         expense.Type === 'Utilities' ? '💡' :
                         expense.Type === 'Entertainment' ? '🎬' :
                         expense.Type === 'Medical' ? '💊' :
                         expense.Type === 'Investments' ? '📈' :
                         expense.Type === 'Personal' ? '👤' : '📦'}
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionType}>{expense.Type}</Text>
                      <Text style={styles.transactionDate}>{new Date(expense.Date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>₹{expense.Amount}</Text>
                  </View>
                </GlassCard>
              ))
            ) : (
              <GlassCard style={styles.emptyCard} intensity={10}>
                <Text style={styles.emptyText}>No recent expenses found. Add one to get started!</Text>
              </GlassCard>
            )}

            {/* Quick Tip */}
            <GlassCard style={styles.tipCard} intensity={15}>
              <View style={styles.tipRow}>
                <Text style={styles.tipEmoji}>💡</Text>
                <Text style={styles.tipText}>Consistency is key to financial freedom. Keep tracking!</Text>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  circle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  date: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileInitial: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
  },
  mainCard: {
    marginBottom: 0,
  },
  cardCarousel: {
    marginBottom: 24,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#10B981',
    width: 20,
  },
  cardLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  trendText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  gridItem: {
    width: (width - 48 - 16) / 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  viewAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
  },
  tipCard: {
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
});
