import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { addHealthExpense, getPopularHealthItems } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";

const healthTypes: ChipOption[] = [
  { label: "Medicine", icon: "💊" },
  { label: "Lab/Testing", icon: "🧪" },
  { label: "Consultation", icon: "👨‍⚕️" },
  { label: "Hospital", icon: "🏥" },
  { label: "Other", icon: "❓" },
];

// Map display labels to backend enum values
const healthLabelMap: Record<string, 'Hospital' | 'Consultation' | 'Testing' | 'Medicine' | 'Other'> = {
  'Medicine': 'Medicine',
  'Lab/Testing': 'Testing',
  'Consultation': 'Consultation',
  'Hospital': 'Hospital',
  'Other': 'Other',
};

export default function HealthExpense() {
  const [item, setItem] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [healthType, setHealthType] = useState("");
  const [description, setDescription] = useState("");
  const [popularItems, setPopularItems] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  const filteredSuggestions = popularItems;

  // Debounced fetch for popular health items
  useEffect(() => {
    if (!showSuggestions) return; // only fetch while user interacting
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingItems(true);
      const { data } = await getPopularHealthItems(item || undefined, 5);
      if (data) setPopularItems(data.map(d => d.place));
      setLoadingItems(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [item, showSuggestions]);

  function handleItemChange(text: string) {
    setItem(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(s: string) {
    setItem(s);
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!item || !healthType || !amount || !date) {
      Alert.alert('Missing Data', 'Health type, item, amount and date are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Medical' as const, // matches union in ExpenseRow
      Amount: Number(amount),
      Description: null,
      Health: healthLabelMap[healthType],
      Health_item: item,
      Health_description: description || '',
    };
    const { error } = await addHealthExpense(payload);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', error.message || 'Failed to save');
      return;
    }
    Alert.alert('Saved', 'Health expense saved');
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={["#43cea2", "#185a9d", "#f7971e", "#e94057"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Health Expense Details</Text>
            <Chips options={healthTypes} selected={healthType} onSelect={setHealthType} />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter item..."
                value={item}
                onChangeText={handleItemChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {loadingItems && <Text style={{ padding: 8, color: '#666' }}>Loading...</Text>}
                  {filteredSuggestions.slice(0,5).map(s => (
                    <TouchableOpacity key={s} onPress={() => handleSuggestionSelect(s)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ color: '#222', fontSize: 16 }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TextInput
              style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%', marginBottom: 16 }}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
            />
            {submitError && <Text style={{ color: 'red', marginBottom: 8 }}>{submitError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: item && healthType && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!item || !healthType || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: item && healthType && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
