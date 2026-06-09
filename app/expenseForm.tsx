import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChipOption, Chips } from "./components/Chips";
import { GlassCard } from "./components/GlassCard";
import { TopRightIconAction } from "./components/TopRightIconAction";

const { width } = Dimensions.get('window');

export default function ExpenseForm() {
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [yearError, setYearError] = useState("");
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const expenseTypes: ChipOption[] = [
    { label: "Food", icon: "🍽️" },
    { label: 'Drinks', icon: '🍹' },
    { label: 'Groceries', icon: '🛒' },
    { label: "Travel", icon: "🚗" },
    { label: "Shopping", icon: "🛍️" },
    { label: "Utilities", icon: "💡" },
    { label: "Entertainment", icon: "🎬" },
    { label: "Health", icon: "💊" },
    { label: 'Investments', icon: '📈' },
    { label: 'Personal', icon: '👤' },
    { label: "Other", icon: "📦" },
  ];

  const expenseTypeToRoute: Record<string, string> = {
    Food: '/expenses/Food',
    Drinks: '/expenses/Drinks',
    Groceries: '/expenses/Groceries',
    Travel: '/expenses/Travel',
    Shopping: '/expenses/Shopping',
    Utilities: '/expenses/Utilities',
    Entertainment: '/expenses/Entertainment',
    Health: '/expenses/Health',
    Investments: '/expenses/Investments',
    Personal: '/expenses/Personal',
    Other: '/expenses/Other',
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleAmountChange = (text: string) => {
    let sanitized = text.replace(/[^0-9.]/g, "");
    if ((sanitized.match(/\./g) || []).length > 1) {
      sanitized = sanitized.replace(/\.+$/, "");
    }
    setAmount(sanitized);
    if (!sanitized || isNaN(Number(sanitized))) {
      setAmountError("Please enter a valid amount");
    } else {
      setAmountError("");
    }
  };

  const handleNext = () => {
    if (!amount || isNaN(Number(amount))) return;
    if (!expenseType) return;
    
    const route = expenseTypeToRoute[expenseType];
    if (route) {
      const monthsArr = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
      ];
      const monthIndex = monthsArr.indexOf(month);
      const day = Math.min(new Date().getDate(), 25);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      router.replace({ pathname: route as any, params: { amount, date: dateStr } });
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ];
  const monthOptions: ChipOption[] = months.map(m => ({ label: m }));
  const isPrimaryActionDisabled = !amount || !expenseType;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0F172A", "#020617"]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>New Expense</Text>
              <TopRightIconAction icon="arrow-forward" onPress={handleNext} disabled={isPrimaryActionDisabled} />
            </View>
            
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>Select Category</Text>
              <Chips
                options={expenseTypes}
                selected={expenseType}
                onSelect={setExpenseType}
              />

              <Text style={styles.label}>Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChange}
                />
              </View>
              {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}

              <Text style={styles.label}>Select Month</Text>
              <Chips
                options={monthOptions}
                selected={month}
                onSelect={setMonth}
              />

              <Text style={styles.label}>Year</Text>
              <TextInput
                style={[styles.input, styles.yearInput]}
                placeholder="Year"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={year}
                onChangeText={setYear}
              />

              <TouchableOpacity 
                style={[styles.nextButton, isPrimaryActionDisabled && styles.disabledButton]} 
                onPress={handleNext}
                disabled={isPrimaryActionDisabled}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 0,
    textAlign: 'left',
  },
  card: {
    padding: 24,
    borderRadius: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencySymbol: {
    fontSize: 24,
    color: '#F8FAFC',
    marginRight: 8,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 56,
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '600',
  },
  yearInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 18,
    height: 48,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
});
