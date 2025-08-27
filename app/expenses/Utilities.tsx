import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addUtilitiesExpense } from "../../lib/expenseRatingService";
import { ChipOption, Chips } from "../components/Chips";

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  async function handleSubmit() {
    setSubmitError(null);
    if (!utilityType || !amount || !date) {
      Alert.alert('Missing Data', 'Utility type, amount and date are required');
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
      setSubmitError(error.message || 'Failed to save');
      Alert.alert('Error', submitError || 'Failed to save');
      return;
    }
    Alert.alert('Saved', 'Utilities expense saved');
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={["#43cea2", "#185a9d", "#f7971e", "#e94057"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Utilities Expense Details</Text>
            <Chips
              options={utilityTypes}
              selected={utilityType}
              onSelect={setUtilityType}
            />
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8, marginTop: 8 }}>Select Frequency</Text>
            <Chips
              options={frequencyTypes}
              selected={frequency}
              onSelect={setFrequency}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter description (optional)..."
                value={description}
                onChangeText={setDescription}
              />
            </View>
            {submitError && <Text style={{ color: 'red', marginBottom: 8 }}>{submitError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: utilityType && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!utilityType || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: utilityType && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
