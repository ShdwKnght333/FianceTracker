import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Button, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ChipOption, Chips, ChipStyles } from "./components/Chips";

export default function ExpenseForm() {
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [yearError, setYearError] = useState("");
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(13)).current;

  // Expense type chips
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
  const chipStyles: ChipStyles = {
    chipsRow: styles.chipsRow,
    chip: styles.chip,
    chipSelected: styles.chipSelected,
    chipIcon: styles.chipIcon,
    chipText: styles.chipText,
    chipTextSelected: styles.chipTextSelected,
  };

  const expenseTypeToRoute: Record<string, "/expenses/Food" | "/expenses/Drinks" | "/expenses/Groceries" | "/expenses/Travel" | "/expenses/Shopping" | "/expenses/Utilities" | "/expenses/Entertainment" | "/expenses/Health" | "/expenses/Investments" | "/expenses/Personal" | "/expenses/Other"> = {
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
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleAmountChange = (text: string) => {
    // Remove non-numeric except dot
    let sanitized = text.replace(/[^0-9.]/g, "");
    // Only one dot allowed
    if ((sanitized.match(/\./g) || []).length > 1) {
      sanitized = sanitized.replace(/\.+$/, "");
    }
    setAmount(sanitized);
    // Validate
    if (!sanitized || isNaN(Number(sanitized))) {
      setAmountError("Please enter a valid number");
    } else {
      setAmountError("");
    }
  };

  const handleYearChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "");
    setYear(sanitized);
    const currentYear = new Date().getFullYear();
    const numYear = Number(sanitized);
    if (!sanitized || isNaN(numYear) || numYear < currentYear - 10 || numYear > currentYear + 10) {
      setYearError(`Enter a valid year between ${currentYear - 10} and ${currentYear + 10}`);
    } else {
      setYearError("");
    }
  };

  const handleNext = () => {
    if (!amount || isNaN(Number(amount))) {
      setAmountError("Please enter a valid number");
      return;
    }
    if (!expenseType) {
      alert("Please select an expense type.");
      return;
    }
    if (!month) {
      alert("Please select a month.");
      return;
    }
    if (!year || !!yearError) {
      setYearError("Please enter a valid year.");
      return;
    }
    const route = expenseTypeToRoute[expenseType];
    if (route) {
      const monthsArr = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
      ];
      const monthIndex = monthsArr.indexOf(month);
      const currentDay = new Date().getDate();
      const day = Math.min(currentDay, 25); // cap at 25
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Removed month and year from params; only passing amount and computed date
      router.replace({ pathname: route, params: { amount, date: dateStr } });
    } else {
      alert("Unknown expense type selected.");
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ];
  const monthOptions: ChipOption[] = months.map(m => ({ label: m }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={["#8e24aa", "#43ea7f", "#00c853"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.formContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.title}>Submit an Expense</Text>
            {/* Expense Type Chips */}
            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4, alignSelf: 'flex-start' }}>Select Expense Type</Text>
            <Chips
              options={expenseTypes}
              selected={expenseType}
              onSelect={setExpenseType}
              styles={chipStyles}
            />
            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4, alignSelf: 'flex-start' }}>Select Month</Text>
            <Chips
              options={monthOptions}
              selected={month}
              onSelect={setMonth}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>Enter Amount</Text>
              <Text style={{ position: 'absolute', left: 12, top: 34, fontSize: 18, color: '#222' }}>₹</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 28 }]}
                placeholder="Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
              />
            </View>
            <View style={{ width: '100%', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>Enter Year</Text>
              <TextInput
                style={styles.input}
                placeholder="Year"
                keyboardType="numeric"
                value={year}
                onChangeText={handleYearChange}
              />
              {yearError ? <Text style={{ color: 'red', marginBottom: 8 }}>{yearError}</Text> : null}
            </View>
            {amountError ? <Text style={{ color: 'red', marginBottom: 8 }}>{amountError}</Text> : null}
            <Button title="Next" onPress={handleNext} disabled={!!amountError || !amount || !expenseType || !month || !year || !!yearError} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formContainer: {
    width: "90%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8E1', // soft light yellow
    margin: 1,
    borderWidth: 1,
    borderColor: '#FFE0B2', // subtle border
  },
  chipSelected: {
    backgroundColor: '#8e24aa', // purple for selected
    borderColor: '#8e24aa',
  },
  chipIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  chipText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
