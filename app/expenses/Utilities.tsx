import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addUtilitiesExpense } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";
import { GlassCard } from "../components/GlassCard";

const utilityTypes: ChipOption[] = [
  { label: "Rent", icon: "🏠" },
  { label: "Electricity", icon: "💡" },
  { label: "Cleaning", icon: "🧹" },
  { label: "Internet", icon: "🌐" },
  { label: "Maintenance", icon: "🛠️" },
  { label: "Laundry", icon: "🧺" },
  { label: "Other", icon: "📦" },
];

const frequencyTypes: ChipOption[] = [
  { label: "Monthly", icon: "🗓️" },
  { label: "Yearly", icon: "📅" },
  { label: "Other", icon: "❓" },
];

const utilityLabelMap: Record<string, 'Electricity' | 'Maintenance' | 'Internet' | 'Cleaning' | 'Rent' | 'Laundry' | 'Other'> = {
  'Rent': 'Rent',
  'Electricity': 'Electricity',
  'Cleaning': 'Cleaning',
  'Internet': 'Internet',
  'Maintenance': 'Maintenance',
  'Laundry': 'Laundry',
  'Other': 'Other',
};

const frequencyLabelMap: Record<string, 'Monthly' | 'Yearly' | 'Other'> = {
  'Monthly': 'Monthly',
  'Yearly': 'Yearly',
  'Other': 'Other',
};

export default function UtilitiesExpense() {
  const [description, setDescription] = useState("");
  const [utilityType, setUtilityType] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  async function handleSubmit() {
    if (!utilityType || !amount || !date) {
      Alert.alert('Missing Data', 'Utility type is required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Utilities' as const,
      Amount: Number(amount),
      Description: null,
      Utility: utilityLabelMap[utilityType],
      Frequency: frequencyLabelMap[frequency],
      Utility_description: description || '',
    };
    const { error } = await addUtilitiesExpense(payload);
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to save');
      return;
    }
    Alert.alert('Success', 'Utilities expense saved');
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
            <Text style={styles.title}>Utilities</Text>
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>Type</Text>
              <Chips options={utilityTypes} selected={utilityType} onSelect={setUtilityType} />
              
              <Text style={styles.label}>Frequency</Text>
              <Chips options={frequencyTypes} selected={frequency} onSelect={setFrequency} />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, { marginBottom: 24 }]}
                placeholder="e.g. March Rent"
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.infoRow}>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Amount</Text><Text style={styles.infoValue}>₹{amount}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{date}</Text></View>
              </View>

              <TouchableOpacity style={[styles.submitButton, (!utilityType || submitting) && styles.disabledButton]} onPress={handleSubmit} disabled={!utilityType || submitting}>
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
  input: { height: 56, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, paddingHorizontal: 16, color: '#F8FAFC', fontSize: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  infoBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  infoLabel: { fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#CBD5E1' },
  submitButton: { backgroundColor: '#F59E0B', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#1E293B' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
