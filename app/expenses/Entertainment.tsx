import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addEntertainmentExpense, getPopularEntertainmentDescriptions } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";
import { GlassCard } from "../components/GlassCard";

const entertainmentTypes: ChipOption[] = [
  { label: "Movie", icon: "🎬" },
  { label: "Games", icon: "🎮" },
  { label: "Sports", icon: "🏅" },
  { label: "Matches", icon: "⚽" },
  { label: "Events", icon: "🎫" },
  { label: "Subscriptions", icon: "💳" },
  { label: "Other", icon: "❓" },
];

const entertainmentLabelMap: Record<string, 'Movie' | 'Event' | 'Games' | 'Subscription' | 'Matches' | 'Sports' | 'Other'> = {
  'Movie': 'Movie',
  'Games': 'Games',
  'Sports': 'Sports',
  'Matches': 'Matches',
  'Events': 'Event',
  'Subscriptions': 'Subscription',
  'Other': 'Other',
};

export default function EntertainmentExpense() {
  const [description, setDescription] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entertainmentType, setEntertainmentType] = useState("");
  const [popularDescriptions, setPopularDescriptions] = useState<string[]>([]);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingDescriptions(true);
      const { data } = await getPopularEntertainmentDescriptions(description || undefined, 5);
      if (data) setPopularDescriptions(data.map(d => d.place));
      setLoadingDescriptions(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description]);

  async function handleSubmit() {
    if (!entertainmentType || !description || !amount || !date) {
      Alert.alert('Missing Data', 'Type and description are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Entertainment' as const,
      Amount: Number(amount),
      Description: null,
      Entertainment: entertainmentLabelMap[entertainmentType],
      Entertainment_description: description || '',
    };
    const { error } = await addEntertainmentExpense(payload);
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to save');
      return;
    }
    Alert.alert('Success', 'Entertainment expense saved');
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
            <Text style={styles.title}>Entertainment</Text>
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>Activity Type</Text>
              <Chips options={entertainmentTypes} selected={entertainmentType} onSelect={setEntertainmentType} />
              
              <Text style={styles.label}>Description</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Deadpool Movie, Gym"
                  placeholderTextColor="#64748B"
                  value={description}
                  onChangeText={(t) => { setDescription(t); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && popularDescriptions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {popularDescriptions.map(item => (
                      <TouchableOpacity key={item} onPress={() => { setDescription(item); setShowSuggestions(false); }} style={styles.suggestionItem}>
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Amount</Text><Text style={styles.infoValue}>₹{amount}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{date}</Text></View>
              </View>

              <TouchableOpacity style={[styles.submitButton, (!description || !entertainmentType || submitting) && styles.disabledButton]} onPress={handleSubmit} disabled={!description || !entertainmentType || submitting}>
                <Text style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Submit'}</Text>
              </TouchableOpacity>
            </GlassCard>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 24 },
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
  submitButton: { backgroundColor: '#EC4899', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#1E293B' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
