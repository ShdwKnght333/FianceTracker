import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addFoodRating, getPopularFoodPlaces } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";
import { GlassCard } from "../components/GlassCard";
import { TopRightIconAction } from "../components/TopRightIconAction";

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
  const date = params.date as string | undefined;

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

  async function handleSubmit() {
    setSubmitError(null);
    if (!mealType || !place || !amount || !date) {
      Alert.alert("Missing Data", "Meal type and place are required");
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Food' as const,
      Amount: Number(amount),
      Description: null,
      Meal: mealType as any,
      Meal_place: place,
    };
    const { error } = await addFoodRating(payload);
    setSubmitting(true);
    if (error) {
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', error.message || 'Failed to save');
      return;
    }
    Alert.alert('Success', 'Food expense saved');
    router.dismissAll();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#0F172A", "#020617"]} style={StyleSheet.absoluteFill} />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Food Details</Text>
              <TopRightIconAction icon="checkmark" onPress={handleSubmit} disabled={!place || !mealType || submitting} />
            </View>
            
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>Meal Type</Text>
              <Chips
                options={mealTypes}
                selected={mealType}
                onSelect={setMealType}
              />

              <Text style={styles.label}>Where did you eat?</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Starbucks, Home"
                  placeholderTextColor="#64748B"
                  value={place}
                  onChangeText={(t) => { setPlace(t); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && popularPlaces.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {popularPlaces.map(item => (
                      <TouchableOpacity key={item} onPress={() => { setPlace(item); setShowSuggestions(false); }} style={styles.suggestionItem}>
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>₹{amount}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{date}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, (!place || !mealType || submitting) && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={!place || !mealType || submitting}
              >
                <Text style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Submit'}</Text>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, paddingTop: 60, paddingBottom: 40 },
  content: { paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', textAlign: 'left', marginBottom: 0 },
  card: { padding: 24, borderRadius: 32 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  inputWrapper: { marginBottom: 24, zIndex: 10 },
  input: { height: 56, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, paddingHorizontal: 16, color: '#F8FAFC', fontSize: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  suggestionsContainer: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#1E293B', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  suggestionItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  suggestionText: { color: '#F8FAFC', fontSize: 16 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  infoBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  infoLabel: { fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#CBD5E1' },
  submitButton: { backgroundColor: '#10B981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#1E293B' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
