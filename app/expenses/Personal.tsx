import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addDefaultExpense, ExpenseRow } from "../../lib/expenseRatingService";

export default function PersonalExpense() {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  async function handleSubmit() {
    if (!description || !amount || !date) {
      Alert.alert('Missing Data', 'Description, amount and date are required');
      return;
    }
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be a positive number');
      return;
    }
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
        console.error(error);
        Alert.alert('Submission Failed', 'Could not save expense.');
        return;
      }
      Alert.alert('Expense Submitted', `Description: ${description}\nAmount: ₹${numericAmount}`);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
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
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Personal Expense Details</Text>
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter description..."
                value={description}
                onChangeText={setDescription}
                editable={!submitting}
              />
            </View>
            <TouchableOpacity
              style={{ backgroundColor: description && amount && date && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              disabled={!description || !amount || !date || submitting}
              onPress={handleSubmit}
            >
              {submitting && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
              <Text style={{ color: description && amount && date && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
