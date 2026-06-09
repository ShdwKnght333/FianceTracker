import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addHealthExpense, getPopularHealthItems } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";
import { GlassCard } from "../components/GlassCard";

const healthTypes: ChipOption[] = [
  { label: "Medicine", icon: "💊" },
  { label: "Lab/Testing", icon: "🧪" },
  { label: "Consultation", icon: "👨‍⚕️" },
  { label: "Hospital", icon: "🏥" },
  { label: "Other", icon: "❓" },
];

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  useEffect(() => {
    if (!showSuggestions) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingItems(true);
      const { data } = await getPopularHealthItems(item || undefined, 5);
      if (data) setPopularItems(data.map(d => d.place));
      setLoadingItems(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [item, showSuggestions]);

  async function handleSubmit() {
    if (!item || !healthType || !amount || !date) {
      Alert.alert('Missing Data', 'Type and item are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Medical' as const,
      Amount: Number(amount),
      Description: null,
      Health: healthLabelMap[healthType],
      Health_item: item,
      Health_description: description || '',
    };
    const { error } = await addHealthExpense(payload);
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to save');
      return;
    }
    Alert.alert('Success', 'Health expense saved');
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
            <Text style={styles.title}>Medical Details</Text>
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>Service Type</Text>
              <Chips options={healthTypes} selected={healthType} onSelect={setHealthType} />
              
              <Text style={styles.label}>Item / Service Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Paracetamol, Dr. Smith"
                  placeholderTextColor="#64748B"
                  value={item}
                  onChangeText={(t) => { setItem(t); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && popularItems.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {popularItems.map(s => (
                      <TouchableOpacity key={s} onPress={() => { setItem(s); setShowSuggestions(false); }} style={styles.suggestionItem}>
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Additional Info</Text>
              <TextInput
                style={[styles.input, { marginBottom: 24 }]}
                placeholder="Prescription details, etc."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.infoRow}>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Amount</Text><Text style={styles.infoValue}>₹{amount}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{date}</Text></View>
              </View>

              <TouchableOpacity style={[styles.submitButton, (!item || !healthType || submitting) && styles.disabledButton]} onPress={handleSubmit} disabled={!item || !healthType || submitting}>
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
  submitButton: { backgroundColor: '#EF4444', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#1E293B' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
