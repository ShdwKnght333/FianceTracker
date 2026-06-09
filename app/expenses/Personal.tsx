import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addDefaultExpense, ExpenseRow } from "../../lib/expenseRatingService";
import { GlassCard } from "../components/GlassCard";
import { TopRightIconAction } from "../components/TopRightIconAction";

export default function PersonalExpense() {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  async function handleSubmit() {
    if (!description || !amount || !date) {
      Alert.alert('Missing Data', 'Description is required');
      return;
    }
    const numericAmount = Number(amount);
    try {
      setSubmitting(true);
      const expense: ExpenseRow = {
        Date: date,
        Type: 'Personal',
        Amount: numericAmount,
        Description: description.trim() || null,
      };
      const { error } = await addDefaultExpense(expense);
      if (error) {
        Alert.alert('Error', 'Could not save expense.');
        return;
      }
      Alert.alert('Success', 'Personal expense saved');
      router.dismissAll();
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', 'Unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#0F172A", "#020617"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Personal</Text>
              <TopRightIconAction icon="checkmark" onPress={handleSubmit} disabled={!description || submitting} />
            </View>
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>What is this for?</Text>
              <TextInput
                style={[styles.input, { marginBottom: 24 }]}
                placeholder="e.g. Gift for friend, Barber"
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                editable={!submitting}
              />

              <View style={styles.infoRow}>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Amount</Text><Text style={styles.infoValue}>₹{amount}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{date}</Text></View>
              </View>

              <TouchableOpacity style={[styles.submitButton, (!description || submitting) && styles.disabledButton]} onPress={handleSubmit} disabled={!description || submitting}>
                {submitting && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', textAlign: 'left', marginBottom: 0 },
  card: { padding: 24, borderRadius: 32 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  input: { height: 56, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, paddingHorizontal: 16, color: '#F8FAFC', fontSize: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  infoBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  infoLabel: { fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#CBD5E1' },
  submitButton: { backgroundColor: '#8B5CF6', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8, flexDirection: 'row' },
  disabledButton: { backgroundColor: '#1E293B' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
