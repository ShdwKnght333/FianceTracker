import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addFoodRating, getPopularFoodPlaces } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";

const mealTypes: ChipOption[] = [
  { label: "Breakfast", icon: "🌅" },
  { label: "Lunch", icon: "🌞" },
  { label: "Snack", icon: "🍪" },
  { label: "Dinner", icon: "🌙" },
];

export default function FoodExpense() {
  const [place, setPlace] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mealType, setMealType] = useState("");
  const [popularPlaces, setPopularPlaces] = useState<string[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined; // passed from parent form

  const filteredSuggestions = popularPlaces;

  // Debounced fetch of popular food places (type-ahead)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingPlaces(true);
      const { data } = await getPopularFoodPlaces(place || undefined, 5);
      if (data) setPopularPlaces(data.map(d => d.place));
      setLoadingPlaces(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [place]);

  function handlePlaceChange(text: string) {
    setPlace(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setPlace(suggestion);
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!mealType || !place || !amount || !date) {
      Alert.alert("Missing Data", "Meal type, place, amount and date are required");
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Food' as const,
      Amount: Number(amount),
      Description: null,
      Meal: mealType as any, // conforms to union
      Meal_place: place,
    };
    const { error } = await addFoodRating(payload);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', submitError || 'Failed to save');
      return;
    }
    Alert.alert('Saved', 'Food expense saved');
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
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Food Expense Details</Text>
            <Chips
              options={mealTypes}
              selected={mealType}
              onSelect={setMealType}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter place..."
                value={place}
                onChangeText={handlePlaceChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {loadingPlaces && (
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
              style={{ backgroundColor: place && mealType && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!place || !mealType || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: place && mealType && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
