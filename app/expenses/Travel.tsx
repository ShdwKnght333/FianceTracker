import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { addTravelExpense, getPopularJourney } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";

const travelTypes: ChipOption[] = [
  { label: "Cycle", icon: "🚲" },
  { label: "Metro", icon: "🚇" },
  { label: "Bus", icon: "🚌" },
  { label: "Cab", icon: "🚕" },
  { label: "Plane", icon: "✈️" },
  { label: "Hotels", icon: "🏨" },
  { label: "Travel Cash", icon: "💵" },
  { label: "Other", icon: "🌍" },
];

export default function TravelExpense() {
  const [itenary, setItenary] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [travelType, setTravelType] = useState("");
  const [details, setDetails] = useState("");
  const [popularJourneys, setPopularJourneys] = useState<string[]>([]);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  const filteredSuggestions = popularJourneys;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingJourneys(true);
      const { data } = await getPopularJourney(itenary || undefined, 5);
      if (data) setPopularJourneys(data.map(d => d.place)); // RPC returns { place }
      setLoadingJourneys(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [itenary]);

  function handleItenaryChange(text: string) {
    setItenary(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setItenary(suggestion);
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!travelType || !itenary || !amount || !date) {
      Alert.alert('Missing Data', 'Travel type, journey, amount and date are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Travel' as const,
      Amount: Number(amount),
      Description: null,
      Travel: travelType as any,
      Journey: itenary,
      Journey_details: details || '',
    };
    const { error } = await addTravelExpense(payload);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', submitError || 'Failed to save');
      return;
    }
    Alert.alert('Saved', 'Travel expense saved');
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
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Travel Expense Details</Text>
            <Chips
              options={travelTypes}
              selected={travelType}
              onSelect={setTravelType}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter journey..."
                value={itenary}
                onChangeText={handleItenaryChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {loadingJourneys && (
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
            <TextInput
              style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%', marginBottom: 16 }}
              placeholder="Details (optional)"
              value={details}
              onChangeText={setDetails}
            />
            {submitError && <Text style={{ color: 'red', marginBottom: 8 }}>{submitError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: travelType && itenary && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!travelType || !itenary || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: travelType && itenary && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
