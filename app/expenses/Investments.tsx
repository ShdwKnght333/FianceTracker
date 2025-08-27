import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { addInvestmentExpense, getPopularInvestmentMediums } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";

const investmentTypes: ChipOption[] = [
  { label: "Kotak Shares", icon: "🏦" },
  { label: "ICICI Shares", icon: "🏛️" },
  { label: "Options Trading", icon: "📈" },
  { label: "Mutual Funds", icon: "💹" },
  { label: "Insurance", icon: "🛡️" },
  { label: "Fixed Deposits", icon: "💰" },
  { label: "Bonds", icon: "📉" },
  { label: "Other", icon: "📦" },
];

const investmentLabelMap: Record<string, 'Kotak Shares' | 'Mutual Funds' | 'ICICI Shares' | 'Bonds' | 'Insurance' | 'Options' | 'FD' | 'Other'> = {
  'Kotak Shares': 'Kotak Shares',
  'ICICI Shares': 'ICICI Shares',
  'Options Trading': 'Options',
  'Mutual Funds': 'Mutual Funds',
  'Insurance': 'Insurance',
  'Fixed Deposits': 'FD',
  'Bonds': 'Bonds',
  'Other': 'Other',
};

export default function InvestmentsExpense() {
  const [investment, setInvestment] = useState(""); // medium or description
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [investmentType, setInvestmentType] = useState("");
  const [popularMediums, setPopularMediums] = useState<string[]>([]);
  const [loadingMediums, setLoadingMediums] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  const filteredSuggestions = popularMediums;

  useEffect(() => {
    if (!showSuggestions) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingMediums(true);
      const { data } = await getPopularInvestmentMediums(investment || undefined, 5);
      if (data) setPopularMediums(data.map(d => d.place));
      setLoadingMediums(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [investment, showSuggestions]);

  function handleInvestmentChange(text: string) {
    setInvestment(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(s: string) {
    setInvestment(s);
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!investmentType || !investment || !amount || !date) {
      Alert.alert('Missing Data', 'Investment type, medium, amount and date are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Investments' as const,
      Amount: Number(amount),
      Description: null,
      Investments: investmentLabelMap[investmentType],
      Medium: investment,
    };
    const { error } = await addInvestmentExpense(payload);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', error.message || 'Failed to save');
      return;
    }
    Alert.alert('Saved', 'Investment expense saved');
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={["#43cea2", "#185a9d", "#f7971e", "#e94057"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Investments Expense Details</Text>
            <Chips options={investmentTypes} selected={investmentType} onSelect={setInvestmentType} />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter medium/company/platform..."
                value={investment}
                onChangeText={handleInvestmentChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {loadingMediums && <Text style={{ padding: 8, color: '#666' }}>Loading...</Text>}
                  {filteredSuggestions.slice(0,5).map(s => (
                    <TouchableOpacity key={s} onPress={() => handleSuggestionSelect(s)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ color: '#222', fontSize: 16 }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {submitError && <Text style={{ color: 'red', marginBottom: 8 }}>{submitError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: investment && investmentType && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!investment || !investmentType || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: investment && investmentType && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
