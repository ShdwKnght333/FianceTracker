import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addGroceriesExpense, getPopularGroceryDescriptions } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";

const groceryTypes: ChipOption[] = [
  { label: "Convenience Store", icon: "🏪" },
  { label: "Quick Delivery", icon: "🚚" },
  { label: "Online Store", icon: "🛒" },
  { label: "Other", icon: "❓" },
];

const groceryLabelMap: Record<string, 'Store' | 'Online' | 'QuickCom' | 'Other'> = {
  'Convenience Store': 'Store',
  'Quick Delivery': 'QuickCom',
  'Online Store': 'Online',
  'Other': 'Other',
};

export default function GroceriesExpense() {
  const [description, setDescription] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [groceryType, setGroceryType] = useState("");
  const [popularDescriptions, setPopularDescriptions] = useState<string[]>([]);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  const filteredSuggestions = popularDescriptions;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingDescriptions(true);
      const { data } = await getPopularGroceryDescriptions(description || undefined, 5);
      if (data) setPopularDescriptions(data.map(d => d.place)); // RPC returns { place }
      setLoadingDescriptions(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description]);

  function handleDescriptionChange(text: string) {
    setDescription(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setDescription(suggestion);
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!groceryType || !amount || !date) {
      Alert.alert('Missing Data', 'Grocery type, amount and date are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Groceries' as const,
      Amount: Number(amount),
      Description: null,
      Grocery: groceryLabelMap[groceryType],
      Grocery_description: description || '',
    };
    const { error } = await addGroceriesExpense(payload);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', submitError || 'Failed to save');
      return;
    }
    Alert.alert('Saved', 'Groceries expense saved');
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
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Groceries Expense Details</Text>
            <Chips
              options={groceryTypes}
              selected={groceryType}
              onSelect={setGroceryType}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter description (optional)..."
                value={description}
                onChangeText={handleDescriptionChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {loadingDescriptions && (
                    <Text style={{ padding: 8, color: '#666' }}>Loading...</Text>
                  )}
                  {filteredSuggestions.slice(0,5).map(item => (
                    <TouchableOpacity key={item} onPress={() => handleSuggestionSelect(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ color: '#222', fontSize: 16 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {submitError && <Text style={{ color: 'red', marginBottom: 8 }}>{submitError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: groceryType && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!groceryType || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: groceryType && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
