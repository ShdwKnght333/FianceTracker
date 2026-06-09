import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addShoppingExpense } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";
import { GlassCard } from "../components/GlassCard";
import { TopRightIconAction } from "../components/TopRightIconAction";

const shoppingTypes: ChipOption[] = [
  { label: "Amazon", icon: "🛒" },
  { label: "Flipkart", icon: "📦" },
  { label: "D-mart", icon: "🏬" },
  { label: "Online", icon: "🌐" },
  { label: "Physical Shop", icon: "🏪" },
  { label: "Other", icon: "❓" },
];

const needTypes: ChipOption[] = [
  { label: "Necessary", icon: "✅" },
  { label: "Meh", icon: "😐" },
  { label: "Impulse", icon: "⚡" },
];

const shoppingLabelMap: Record<string, 'Amazon' | 'Flipkart' | 'D-Mart' | 'Online' | 'Shop' | 'Other'> = {
  'Amazon': 'Amazon',
  'Flipkart': 'Flipkart',
  'D-mart': 'D-Mart',
  'Online': 'Online',
  'Physical Shop': 'Shop',
  'Other': 'Other',
};

const needLabelMap: Record<string, 'Necessity' | 'Meh' | 'Impulse'> = {
  'Necessary': 'Necessity',
  'Meh': 'Meh',
  'Impulse': 'Impulse',
};

export default function ShoppingExpense() {
  const [item, setItem] = useState("");
  const [shoppingType, setShoppingType] = useState("");
  const [needType, setNeedType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  function handleSubmit() {
    if (!item || !shoppingType || !needType || !amount || !date) {
      Alert.alert('Missing Data', 'All fields are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Shopping' as const,
      Amount: Number(amount),
      Description: null,
      Shopping: shoppingLabelMap[shoppingType],
      Need: needLabelMap[needType],
      Item: item,
    };
    addShoppingExpense(payload).then(({ error }) => {
      setSubmitting(false);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to save');
        return;
      }
      Alert.alert('Success', 'Shopping expense saved');
      router.dismissAll();
      router.replace('/');
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#0F172A", "#020617"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Shopping Details</Text>
              <TopRightIconAction icon="checkmark" onPress={handleSubmit} disabled={!item || !shoppingType || !needType || submitting} />
            </View>
            <GlassCard style={styles.card} intensity={25}>
              <Text style={styles.label}>Where did you buy?</Text>
              <Chips options={shoppingTypes} selected={shoppingType} onSelect={setShoppingType} />
              
              <Text style={styles.label}>How necessary was it?</Text>
              <Chips options={needTypes} selected={needType} onSelect={setNeedType} />

              <Text style={styles.label}>What did you buy?</Text>
              <TextInput
                style={[styles.input, { marginBottom: 24 }]}
                placeholder="Item name"
                placeholderTextColor="#64748B"
                value={item}
                onChangeText={setItem}
              />

              <View style={styles.infoRow}>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Amount</Text><Text style={styles.infoValue}>₹{amount}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{date}</Text></View>
              </View>

              <TouchableOpacity style={[styles.submitButton, (!item || !shoppingType || !needType || submitting) && styles.disabledButton]} onPress={handleSubmit} disabled={!item || !shoppingType || !needType || submitting}>
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
  submitButton: { backgroundColor: '#8B5CF6', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#1E293B' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
